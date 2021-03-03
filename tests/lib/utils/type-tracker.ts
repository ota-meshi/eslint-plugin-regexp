import assert from "assert"
import { Linter } from "eslint"
import path from "path"
import type { Expression } from "estree"
import { createTypeTracker } from "../../../lib/utils/type-tracker"
import * as tsParser from "@typescript-eslint/parser"

const tsconfigRootDir = path.resolve(__dirname, "../../..")
const project = "tsconfig.json"
const filename = path.join(tsconfigRootDir, "./tests/lib/utils/type-tracker.ts")

type TestCase = {
    code: string
    type: string | string[]
    parser?: string
    parserOptions?: any
}
const TESTCASES: TestCase[] = [
    {
        code: `
        const a = 'aaa'
        a;
        `,
        type: "String",
    },
    {
        code: `
        const a = []
        const aa = a
        aa;
        `,
        type: "Array",
    },
    {
        code: `
        const a = {}
        a
        `,
        type: "Object",
    },
    {
        code: `
        new RegExp('a')
        `,
        type: "RegExp",
    },
    {
        code: `
        const b = String(a);
        b;
        `,
        type: "String",
    },
    {
        code: `
        Number(a)
        `,
        type: "Number",
    },
    {
        code: `
        Boolean(a)
        `,
        type: "Boolean",
    },
    {
        code: `/a/`,
        type: "RegExp",
    },
    {
        code: `123n`,
        type: "BigInt",
    },
    {
        code: `null`,
        type: "null",
    },
    {
        code: `123`,
        type: "Number",
    },
    {
        code: `true`,
        type: "Boolean",
    },
    {
        code: `""`,
        type: "String",
    },
    {
        code: "`${123}`",
        type: "String",
    },
    {
        code: "a = () => 1",
        type: "Function",
    },
    {
        code: "a = function () {}",
        type: "Function",
    },
    {
        code: "a+''",
        type: "String",
    },
    {
        code: "'a'+a",
        type: "String",
    },
    {
        code: `
        const z = 0
        z+1
        `,
        type: "Number",
    },
    {
        code: `a === b`,
        type: "Boolean",
    },
    {
        code: `a - b`,
        type: "Number",
    },
    {
        code: `typeof s`,
        type: "String",
    },
    {
        code: `+ s`,
        type: "Number",
    },
    {
        code: `void a.b`,
        type: "undefined",
    },
    {
        code: `! a.b`,
        type: "Boolean",
    },
    {
        code: `const c = (a,b,123);
        c`,
        type: "Number",
    },
    {
        code: `const c = 123?.toString();
        c`,
        type: "String",
    },
    {
        code: `const c = class {};
        c`,
        type: [],
    },
    {
        code: `Unknown()`,
        type: [],
    },
    {
        code: `
        const s = String
        s(1)`,
        type: "String",
    },
    {
        code: `
        const s = RegExp
        new s('a')`,
        type: "RegExp",
    },
    {
        code: `
        const s = []
        s.filter(a=>a).reverse()`,
        type: "Array",
    },
    {
        code: `
        String.raw\`\`;
        `,
        type: "String",
    },
    {
        code: `
        Object.freeze([]);
        `,
        type: "Array",
    },
    {
        code: `
        const s = 'abc'
        s[0]
        `,
        type: "String",
    },
    {
        code: `
        const s = 'abc'
        s.length
        `,
        type: "Number",
    },
    {
        code: `
        const s = 'abc'.split(',')[0]
        s.length
        `,
        type: "Number",
    },
    {
        code: `
        const a = [1,2,3,4]
        a[2]
        `,
        type: "Number",
    },
    {
        code: `
        const a = [1,2,3,4,true,false,'',123n,/a/]
        a[2]
        `,
        type: ["BigInt", "Boolean", "Number", "RegExp", "String"],
    },
    {
        code: `
        const a = [1,2,3,4,true,false,'',123n,/a/]
        for (const e of a) {
            e
        }
        `,
        type: ["BigInt", "Boolean", "Number", "RegExp", "String"],
    },
    {
        code: `
        const is = [1,2,3,4]
        const ss = 'a,b,c'.split(/,/g)
        const a = [...is, ...ss]
        a[2]
        `,
        type: ["Number", "String"],
    },
    {
        code: `
        const is = [1,2,3,4]
        const ss = 'a,b,c'.split(/,/g)
        const a = [].concat(is,ss)
        a[2]
        `,
        type: ["Number", "String"],
    },
    {
        code: `
        const is = [1,2,3,4]
        const ss = 'a,b,c'.split(/,/g)
        const a = [...[].concat(is), ss]
        a
        `,
        type: ["Array<Array<String>|Number>"],
    },
    {
        code: `
        const obj = {a: 'foo'}
        obj.a
        `,
        type: ["String"],
    },
    {
        code: `
        const obj1 = {a: 'foo'}
        const obj2 = {a: 42}
        const obj3 = {a: true, ...obj1, ...obj2}
        obj3.a
        `,
        type: ["Number"],
    },
    {
        code: `
        const obj1 = {a: 'foo'}
        const obj2 = {a: 42}
        const obj3 = {...obj1, ...obj2, a: true}
        obj3.a
        `,
        type: ["Boolean"],
    },
    {
        code: `
        const obj1 = {a: 'foo'}
        const obj2 = {a: 42}
        const obj3 = Object.assign({a: true}, obj1, obj2)
        obj3.a
        `,
        type: ["Number"],
    },
    {
        code: `
        const obj1 = {a: 'foo'}
        const obj2 = {a: 42}
        const obj3 = Object.assign(obj1, obj2, {a: true})
        obj3.a
        `,
        type: ["Boolean"],
    },
    {
        code: `
        const f = parseFloat
        f(a)
        `,
        type: ["Number"],
    },
    {
        code: `
        const obj = { foo: parseFloat }
        obj.foo(a)
        `,
        type: ["Number"],
    },
    {
        code: `
        Number.MAX_VALUE
        `,
        type: ["Number"],
    },
    {
        code: `
        const a = [1,2,3]
        for (const e of a) {
            e
        }
        `,
        type: ["Number"],
    },
    {
        code: `
        const a = new Set([1,2,3])
        for (const e of a) {
            e
        }
        `,
        type: ["Number"],
    },
    {
        code: `
        const a = new Map([[1,2]])
        a.size
        `,
        type: ["Number"],
    },
    {
        code: `
        const a = new Map([['a',1], ['b',2]])
        a.get('a')
        `,
        type: ["Number"],
    },
    {
        code: `
        const a = new Map([[1,'a'], [2,'b']])
        a.get(1)
        `,
        type: ["String"],
    },
    {
        code: `
        BigInt.asIntN(64, v)
        `,
        type: ["BigInt"],
    },
    {
        code: `
        const a = [{a: 's'}, {a: 42}, new Map(), 123n]
        a[1].a
        `,
        type: ["Number", "String"],
    },
    {
        code: `
        1n + 2n
        `,
        type: ["BigInt"],
    },
    {
        code: `
        1n * 2n
        `,
        type: ["BigInt"],
    },
    {
        code: `
        const a = 2n;
        -a
        `,
        type: ["BigInt"],
    },
    {
        code: `
        const s: 'a' | 'b' | false = a
        s
        `,
        type: ["Boolean", "String"],
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        const r: {[key:string]:string} = {foo:'s'}
        const a = r.foo; a
        `,
        type: "String",
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        const r: {[key:string]:string} = {foo:'s'}
        r
        `,
        type: "Object",
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        type A = 42 | 'foo' | 42n
        const r: A = a
        r
        `,
        type: ["BigInt", "Number", "String"],
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        type A = 42 | 'foo' | 42n
        const r: A = a
        const b = (r as any);
        b;
        `,
        type: [],
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        const b = [1,2,3]
        const c = b;
        c
        `,
        type: "Array",
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        const b = [1,2,3] as const
        const c = b;
        c
        `,
        type: "Array",
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        const b: ReadonlyArray<String> = a
        const c = b;
        c
        `,
        type: "Array",
        parser: "@typescript-eslint/parser",
    },

    {
        code: `
        /** @type { { foo: number } } */
        const r = a
        r.foo
        `,
        type: "Number",
    },
    {
        code: `
        /** @type {string[]} */
        const r = a
        r[123]
        `,
        type: "String",
    },
    {
        code: `
        const r = /** @type {string[]} */(a)
        r[123]
        `,
        type: "String",
    },
    {
        code: `
        const r = /** @type {string[]} */a
        r[123]
        `,
        type: [],
    },
    {
        code: `
        /** 
         * @param {number} a
         * @param {string} b
         */
        function fn(a, b) {
            b[3]
        }
        `,
        type: "String",
    },
    {
        code: `
        /** 
         * @param {string} b
         * @param {number} a
         */
        function fn(a, b) {
            b[3]
        }
        `,
        type: "String",
    },
    {
        code: `
        /** 
         * @param {string}
         * @param {number}
         */
        function fn(a, b) {
            b
        }
        `,
        type: "Number",
    },
    {
        code: `
        /** 
         * @param {object} arg
         * @param {string} arg.b
         * @param {number} arg.a
         */
        function fn({a, b}) {
            b
        }
        `,
        type: "String",
    },
    {
        code: `
        /**
         * @param {string} b
         * @returns {number}
         */
        const a = function(b) {}
        const c = a()
        c
        `,
        type: "Number",
    },
    {
        code: `
        /**
         * @param {string} b
         * @returns {number}
         */
        function a(b) {}
        const c = a()
        c
        `,
        type: "Number",
    },
    {
        code: `
        const a =
            /**
             * @returns {number}
             */
            () => foo
        const c = a()
        c
        `,
        type: "Number",
    },
    {
        code: `
        function a() { }
        a
        `,
        type: "Function",
    },
    {
        code: `
        /** @type {'str' | 42} */
        let a
        a
        `,
        type: ["Number", "String"],
    },
    {
        code: `
        /** @type {Map<string, number>}} */
        let a
        a.get('a')
        `,
        type: "Number",
    },
    {
        code: `
        /** @type {Set<string>}} */
        let a
        for (const e of a) {
            e
        }
        `,
        type: "String",
    },
]
describe("type track", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            assert.deepStrictEqual(
                getTypesWithLinter(testCase),
                Array.isArray(testCase.type) ? testCase.type : [testCase.type],
            )
        })
    }
})

/**
 * Get type
 */
function getTypesWithLinter(testCase: TestCase): string[] {
    let types: string[]
    const linter = new Linter()
    linter.defineRule("test", {
        create(context) {
            let lastExpr: Expression | null = null
            return {
                ":expression:exit"(node: Expression) {
                    lastExpr = node
                },
                "Program:exit"() {
                    // if (
                    //     context
                    //         .getSourceCode()
                    //         .text.includes("[{a: 's'},{a: 42}]")
                    // ) {
                    //     debugger
                    // }
                    types = createTypeTracker(context).getTypes(lastExpr!)
                },
            }
        },
    })
    linter.defineParser("@typescript-eslint/parser", tsParser as never)
    const r = linter.verify(
        testCase.code,
        {
            globals: {
                Set: "readonly",
                Map: "readonly",
                BigInt: "readonly",
            },
            parser: testCase.parser,
            parserOptions: {
                ecmaVersion: 2020,
                ...(testCase.parserOptions ?? {}),
                tsconfigRootDir,
                project,
            },
            rules: {
                test: "error",
            },
        },
        filename,
    )
    if (r.length) {
        assert.deepStrictEqual(r, [])
    }

    return types!
}
