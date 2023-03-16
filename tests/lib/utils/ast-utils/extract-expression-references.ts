import type { Rule } from "eslint"
import { Linter } from "eslint"
import assert from "assert"
import type * as ESTree from "estree"
import {
    CALL,
    CONSTRUCT,
    ReferenceTracker,
} from "@eslint-community/eslint-utils"
import type { ExpressionReference } from "../../../../lib/utils/ast-utils"
import { extractExpressionReferences } from "../../../../lib/utils/ast-utils"
import { isRegexpLiteral } from "../../../../lib/utils/ast-utils/utils"

type ExpressionReferenceResult = { type: string; [key: string]: any }

type TestCase = {
    code: string
    results: ExpressionReferenceResult[][]
    sourceType?: "script" | "module"
}
const TESTCASES: TestCase[] = [
    {
        code: `const a = /a/`,
        results: [[{ type: "unused", node: "a" }]],
    },
    {
        code: `const a = /a/
        b[a]`,
        results: [[{ type: "unknown", node: "a" }]],
    },
    {
        code: `
        export const a = /a/
        a.source`,
        sourceType: "module",
        results: [
            [
                { type: "exported", node: "/a/" },
                { type: "member", node: "a", memberExpression: "a.source" },
            ],
        ],
    },
    {
        code: `
        const a = /a/
        export default a
        a.source`,
        sourceType: "module",
        results: [
            [
                { type: "exported", node: "a" },
                { type: "member", node: "a", memberExpression: "a.source" },
            ],
        ],
    },
    {
        code: `/* exported a */
        const a = /a/
        a.source`,
        sourceType: "script",
        results: [
            [
                { type: "exported", node: "a" },
                { type: "member", node: "a", memberExpression: "a.source" },
            ],
        ],
    },
    {
        code: `const a = /a/
        a.source`,
        results: [
            [{ type: "member", node: "a", memberExpression: "a.source" }],
        ],
    },
    {
        code: `const a = /a/
        const {source} = a`,
        results: [[{ type: "destructuring", node: "a", pattern: "{source}" }]],
    },
    {
        code: `const a = /a/
        fn(a)`,
        results: [[{ type: "argument", node: "a", callExpression: "fn(a)" }]],
    },
    {
        code: `const a = /a/
        fn(a)

        function fn(b) { b.source }`,
        results: [
            [{ type: "member", node: "b", memberExpression: "b.source" }],
        ],
    },
    {
        code: `const a = /a/
        a()`,
        results: [[{ type: "call", node: "a" }]],
    },
    {
        code: `const a = /a/
        for (const b of a) {}`,
        results: [
            [{ type: "iteration", node: "a", for: "for (const b of a) {}" }],
        ],
    },
]
describe("extractExpressionReferences", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            let results: ExpressionReferenceResult[][] = []
            const regexps: (ESTree.NewExpression | ESTree.CallExpression)[] = []
            const testNodes: (
                | ESTree.Literal
                | ESTree.NewExpression
                | ESTree.CallExpression
            )[] = []
            const linter = new Linter()
            linter.defineRule("test", {
                create(context) {
                    return {
                        Program() {
                            const scope = context.getScope()
                            const tracker = new ReferenceTracker(scope)

                            for (const {
                                node,
                            } of tracker.iterateGlobalReferences({
                                RegExp: { [CALL]: true, [CONSTRUCT]: true },
                            })) {
                                const newOrCall = node as
                                    | ESTree.NewExpression
                                    | ESTree.CallExpression
                                regexps.push(newOrCall)
                            }
                        },
                        Literal(node: ESTree.Literal) {
                            if (isRegexpLiteral(node)) {
                                testNodes.push(node)
                            }
                        },
                        "NewExpression,CallExpression"(
                            node: ESTree.NewExpression | ESTree.CallExpression,
                        ) {
                            if (regexps.includes(node)) {
                                testNodes.push(node)
                            }
                        },
                        "Program:exit"() {
                            results = testNodes.map((node) =>
                                [
                                    ...extractExpressionReferences(
                                        node,
                                        context,
                                    ),
                                ].map((r) => toResult(r, context)),
                            )
                        },
                    }
                },
            })
            const r = linter.verify(
                testCase.code,
                {
                    globals: {
                        Set: "readonly",
                        Map: "readonly",
                        BigInt: "readonly",
                        window: "readonly",
                        globalThis: "readonly",
                    },
                    parserOptions: {
                        ecmaVersion: 2020,
                        sourceType: testCase.sourceType,
                    },
                    rules: {
                        test: "error",
                    },
                },
                "test.js",
            )
            if (r.length) {
                assert.deepStrictEqual(r, [])
            }

            assert.deepStrictEqual(results, testCase.results)
        })
    }
})

function toResult(
    ref: ExpressionReference,
    context: Rule.RuleContext,
): ExpressionReferenceResult {
    const result: ExpressionReferenceResult = {
        type: ref.type,
        node: undefined,
    }
    for (const key of Object.keys(ref)) {
        if (key === "type") continue

        const o = (ref as any)[key]
        result[key] = o.range ? context.getSourceCode().getText(o) : o
    }

    return result
}
