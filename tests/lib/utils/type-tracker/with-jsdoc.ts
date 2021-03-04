import type { TestCase } from "./test-utils"
import { testTypeTrackerWithLinter } from "./test-utils"

const TESTCASES: TestCase[] = [
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
    {
        code: `
        /** @type {boolean} */
        let bool
        bool
        `,
        type: "Boolean",
    },
    {
        code: `
        /** @type {BigInt} */
        let bigint
        bigint
        `,
        type: "BigInt",
    },
    {
        code: `
        /** @type {RegExp} */
        let regexp
        regexp
        `,
        type: "RegExp",
    },
    {
        code: `
        /** @type {function} */
        let fn
        fn
        `,
        type: "Function",
    },
    {
        code: `
        /** @type {object} */
        let obj
        obj
        `,
        type: "Object",
    },
    {
        code: `
        /** @type {Record<string, number>} */
        let rec
        `,
        type: "Object",
    },
    {
        code: `
        /** @type {?} */
        let a
        a
        `,
        type: [],
    },
    {
        code: `
        /** @param {...} a */
        function f(a) {
            a.length
        }
        `,
        type: "Number",
    },
    {
        code: `
        /** @param {...number} a */
        function f(...a) {
            a[1]
        }
        `,
        type: "Number",
    },
    {
        code: `
        /** @param {number=} a */
        function f(a) {
            a
        }
        `,
        type: "Number",
    },
]
describe("type track with jsdoc", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
