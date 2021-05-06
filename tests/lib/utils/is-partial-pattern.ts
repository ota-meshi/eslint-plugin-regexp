import { Linter } from "eslint"
import assert from "assert"
import type * as ESTree from "estree"
import { isRegexpLiteral } from "../../../lib/utils"
import { isPartialPattern } from "../../../lib/utils/is-partial-pattern"
import { CALL, CONSTRUCT, ReferenceTracker } from "eslint-utils"

type TestCase = {
    code: string
    results: boolean[]
}
const TESTCASES: TestCase[] = [
    {
        code: `const a = /a/`,
        results: [false],
    },
    {
        code: `/a/`,
        results: [false],
    },
    {
        code: `
        const a = /a/
        const b = new RegExp(a.source+'b')
        b.exec(str)
        `,
        results: [true, false],
    },
    {
        code: `
        const a = /a/
        const b = new RegExp(a?.source+'b')
        b.exec(str)
        `,
        results: [true, false],
    },
    {
        code: `
        const a = /a/
        const b = new RegExp(a['source']+'b')
        b.exec(str)
        `,
        results: [true, false],
    },
    {
        code: `
        const a = /a/
        const b = new RegExp(source[a]+'b')
        b.exec(str)
        `,
        results: [false, false],
    },
    {
        code: `
        const a = /a/
        const b = new RegExp(a.toString()+'b')
        b.exec(str)
        `,
        results: [false, false],
    },
    {
        code: `
        const {source} = /a/
        const b = new RegExp(source+'b')
        b.exec(str)
        `,
        results: [true, false],
    },
    {
        code: `
        const {'source': src} = /a/
        const b = new RegExp(src+'b')
        b.exec(str)
        `,
        results: [true, false],
    },
    {
        code: `
        const {['source']: src} = /a/
        const b = new RegExp(src+'b')
        b.exec(str)
        `,
        results: [true, false],
    },
    {
        code: `
        ({source} = /a/);
        const b = new RegExp(source+'b')
        b.exec(str)
        `,
        results: [true, false],
    },
    {
        code: `
        const {unknown: source} = /a/
        const b = new RegExp(source+'b')
        b.exec(str)
        `,
        results: [false, false],
    },
    {
        code: `
        getSource(/a/)
        toString(/b/)
        
        function getSource(p) {
            return p.source
        }
        function toString(p) {
            return p.toString()
        }
        `,
        results: [true, false],
    },
    {
        code: `
        const getSource = function (p) {
            return p.source
        }
        const toString = function (p) {
            return p.toString()
        }
        getSource(/a/)
        toString(/b/)
        `,
        results: [true, false],
    },
    {
        code: `
        const getSource = (p) => p.source
        const toString = (p) => p.toString()
        getSource(/a/)
        toString(/b/)
        `,
        results: [true, false],
    },
    {
        code: `
        getSource(42, /a/)
        getSource(/b/, 42)
        
        function getSource(p, p2) {
            return p2.source
        }
        `,
        results: [true, false],
    },
    {
        code: `
        fn(/a/)
        
        function fn(p) {
            return fn(p)
        }
        `,
        results: [false],
    },
    {
        code: `
        const fn = getSource
        fn(42, /a/)
        fn(/b/, 42)
        
        function getSource(p, p2) {
            return p2.source
        }
        `,
        results: [true, false],
    },
]
describe("isPartialPattern", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            let results: boolean[] = []
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
                                isPartialPattern(node, context),
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
