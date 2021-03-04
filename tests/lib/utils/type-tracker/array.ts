import type { TestCase } from "./test-utils"
import { testTypeTrackerWithLinter } from "./test-utils"

const TESTCASES: TestCase[] = [
    {
        code: `
        const a = [1,2]
        a.pop();
        `,
        type: "Number",
    },
    {
        code: `
        const a = [u]
        a.pop();
        `,
        type: [],
    },
    {
        code: `
        const a = [u]
        const b = [123]
        const c = a.concat(b)
        c.shift();
        `,
        type: "Number",
    },
    {
        code: `
        const a = ['a']
        for (const e of a.entries()) {
            e[2]
        }
        `,
        type: ["Number", "String"],
    },
    {
        code: `
        const a = ['a']
        for (const e of a.keys()) {
            e
        }
        `,
        type: "Number",
    },
    {
        code: `
        const a = ['a']
        for (const e of a.values()) {
            e
        }
        `,
        type: "String",
    },
    {
        code: `
        Array
        `,
        type: "Function",
    },
    {
        code: `
        Array(0)
        `,
        type: "Array",
    },
    {
        code: `
        Array.isArray(b)
        `,
        type: "Boolean",
    },
    {
        code: `
        /** @returns {number} */
        function fn() {}
        const a = ['s']
        a.map(fn)
        `,
        type: "Array<Number>",
    },
    {
        code: `
        const a = ['s']
        a.map(Object)
        `,
        type: "Array<String>",
    },
]
describe("type track for Array", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
