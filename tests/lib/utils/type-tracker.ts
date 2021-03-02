import assert from "assert"
import { Linter } from "eslint"
import type { Expression } from "estree"
import { createTypeTracker } from "../../../lib/utils/type-tracker"
import * as tsParser from "@typescript-eslint/parser"

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
                    //         .text.includes("{[key:string]:string} = {foo:'s'}")
                    // ) {
                    //     debugger
                    // }
                    types = createTypeTracker(context).getTypes(lastExpr!)
                },
            }
        },
    })
    linter.defineParser("@typescript-eslint/parser", tsParser as never)
    const r = linter.verify(testCase.code, {
        parser: testCase.parser,
        parserOptions: {
            ecmaVersion: 2020,
            ...(testCase.parserOptions ?? {}),
        },
        rules: {
            test: "error",
        },
    })
    if (r.length) {
        assert.deepStrictEqual(r, [])
    }

    return types!
}