import type { TestCase } from "./test-utils.ts"
import { testTypeTrackerWithLinter } from "./test-utils.ts"

const TESTCASES: TestCase[] = [
    {
        code: `
        Function(a)
        `,
        type: "Function",
    },
    {
        code: `
        /** @returns {number} */
        function fn() {
        }
        fn
        `,
        type: "Function",
    },
    {
        code: `
        /** @returns {number} */
        function fn() {
        }
        fn()
        `,
        type: "Number",
    },
    {
        code: `
        /** @returns {number} */
        function fn() {
        }
        fn.bind()()
        `,
        type: "Number",
    },
    {
        code: `
        /** @returns {number} */
        function fn() {
        }
        for (const e of fn) {
            e
        }
        `,
        type: [],
    },
    {
        code: `
        function fn() {
        }
        fn
        `,
        type: "Function",
    },
    {
        code: `
        function fn() {
        }
        fn()
        `,
        type: [],
    },
    {
        code: `
        const a = Function
        a.b
        `,
        type: [],
    },
    {
        code: `
        const a = Function
        a()
        `,
        type: "Function",
    },
    {
        code: `
        const a = {}
        a.valueOf()
        `,
        type: "Object",
    },
    {
        code: `
        const a = [1,2]
        a.map()
        `,
        type: "Array",
    },
    {
        code: `
        const a = [1,2]
        a.forEach()
        `,
        type: "undefined",
    },
    {
        code: `
        /a/.compile('b')
        `,
        type: "RegExp",
    },
]
describe("type track for function", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
