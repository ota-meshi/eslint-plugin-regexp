import assert from "assert"
import { Linter } from "eslint"
import type { Rule } from "eslint"
import type * as ESTree from "estree"
import type { PropertyReference } from "../../../../lib/utils/ast-utils"
import { extractPropertyReferences } from "../../../../lib/utils/ast-utils"
import { isRegexpLiteral } from "../../../../lib/utils/ast-utils/utils"
import {
    CALL,
    CONSTRUCT,
    ReferenceTracker,
} from "@eslint-community/eslint-utils"

type PropertyReferenceResult = {
    [key: string]: { type: string; refs?: PropertyReferenceResult }
}

type TestCase = {
    code: string
    results: PropertyReferenceResult[]
    sourceType?: "script" | "module"
}
const TESTCASES: TestCase[] = [
    {
        code: `const a = /a/`,
        results: [
            {
                $unknown1: { type: "unknown" },
            },
        ],
    },
    {
        code: `const a = /a/;
        a.b;
        const d = a.c;
        d.e;`,
        results: [
            {
                b: {
                    type: "member",
                    refs: {
                        $unknown1: { type: "unknown" },
                    },
                },
                c: {
                    type: "member",
                    refs: {
                        e: {
                            type: "member",
                            refs: {
                                $unknown2: { type: "unknown" },
                            },
                        },
                    },
                },
            },
        ],
    },
    {
        code: `const a = /a/;
        const b = 'bb'
        a[b]
        a[c];`,
        results: [
            {
                bb: {
                    type: "member",
                    refs: {
                        $unknown1: { type: "unknown" },
                    },
                },
                $unknown2: {
                    type: "unknown",
                    refs: {
                        $unknown3: { type: "unknown" },
                    },
                },
            },
        ],
    },
    {
        code: `const a = /a/;
        const {b,c} = a;
        c.d.e;`,
        results: [
            {
                b: {
                    type: "destructuring",
                    refs: {
                        $unknown1: { type: "unknown" },
                    },
                },
                c: {
                    type: "destructuring",
                    refs: {
                        d: {
                            type: "member",
                            refs: {
                                e: {
                                    type: "member",
                                    refs: {
                                        $unknown2: { type: "unknown" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
    {
        code: `const a = /a/;
        const b = 'bb'
        const {[b]: c, [d]: e} = a;`,
        results: [
            {
                bb: {
                    type: "destructuring",
                    refs: {
                        $unknown1: { type: "unknown" },
                    },
                },
                $unknown2: {
                    type: "unknown",
                    refs: {
                        $unknown3: { type: "unknown" },
                    },
                },
            },
        ],
    },
    {
        code: `const a = /a/;
        for (const b of a) {
            const y = b.group.y
        }`,
        results: [
            {
                $iteration1: {
                    type: "iteration",
                    refs: {
                        group: {
                            type: "member",
                            refs: {
                                y: {
                                    type: "member",
                                    refs: {
                                        $unknown2: { type: "unknown" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
    {
        code: `const a = /a/;
        const a1 = [...a];
        a1[1];`,
        results: [
            {
                "1": {
                    type: "member",
                    refs: {
                        $unknown1: { type: "unknown" },
                    },
                },
            },
        ],
    },
    {
        code: `const a = /a/;
        const a1 = {...a};
        a1.source;`,
        results: [
            {
                source: {
                    type: "member",
                    refs: {
                        $unknown1: { type: "unknown" },
                    },
                },
            },
        ],
    },
    {
        code: `const a = /a/;
        const arr = [1,2,3, ...a];
        arr[4];`,
        results: [
            {
                "1": {
                    type: "member",
                    refs: {
                        $unknown1: { type: "unknown" },
                    },
                },
            },
        ],
    },
    {
        code: `const a = /a/;
        const [b, ...arr] = [...a];
        arr[0];`,
        results: [
            {
                "0": {
                    type: "destructuring",
                    refs: {
                        $unknown1: { type: "unknown" },
                    },
                },
                "1": {
                    type: "member",
                    refs: {
                        $unknown2: { type: "unknown" },
                    },
                },
            },
        ],
    },
    {
        code: `const a = /a/;
        fn([...a]);
        function fn([,b] = []) {
            b.c;
        }`,
        results: [
            {
                "1": {
                    type: "destructuring",
                    refs: {
                        c: {
                            type: "member",
                            refs: {
                                $unknown1: { type: "unknown" },
                            },
                        },
                    },
                },
            },
        ],
    },
]
describe("extractPropertyReferences", () => {
    for (const testCase of TESTCASES.reverse()) {
        it(testCase.code, () => {
            let results: PropertyReferenceResult[] = []
            const regexps: (ESTree.NewExpression | ESTree.CallExpression)[] = []
            const testNodes: (
                | ESTree.Literal
                | ESTree.NewExpression
                | ESTree.CallExpression
            )[] = []

            function create(context: Rule.RuleContext) {
                return {
                    Program(program: ESTree.Program) {
                        const scope = context.sourceCode.getScope(program)
                        const tracker = new ReferenceTracker(scope)

                        for (const { node } of tracker.iterateGlobalReferences({
                            RegExp: {
                                [CALL]: true,
                                [CONSTRUCT]: true,
                            },
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
                            toResult([
                                ...extractPropertyReferences(node, context),
                            ]),
                        )
                    },
                }
            }

            const linter = new Linter({ configType: "flat" })
            const r = linter.verify(
                testCase.code,
                {
                    plugins: {
                        // @ts-expect-error -- ignore type error for eslint v9
                        test: {
                            rules: {
                                test: {
                                    create,
                                },
                            },
                        },
                    },
                    languageOptions: {
                        globals: {
                            Set: "readonly",
                            Map: "readonly",
                            BigInt: "readonly",
                            window: "readonly",
                            globalThis: "readonly",
                        },
                        ecmaVersion: 2020,
                        sourceType: testCase.sourceType || "module",
                    },
                    rules: {
                        "test/test": "error",
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
    refs: PropertyReference[],
    seq = [0],
): PropertyReferenceResult {
    const result: PropertyReferenceResult = {}
    for (const ref of refs) {
        let name
        if (ref.type === "member" || ref.type === "destructuring") {
            name = ref.name
        } else {
            name = `$${ref.type}${String(++seq[0])}`
        }
        result[name] = {
            type: ref.type,
        }
        if (ref.extractPropertyReferences) {
            result[name].refs = toResult(
                [...ref.extractPropertyReferences()],
                seq,
            )
        }
    }

    return result
}
