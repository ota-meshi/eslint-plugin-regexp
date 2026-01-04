import type { TestCase } from "./test-utils.ts"
import { testTypeTrackerWithLinter } from "./test-utils.ts"

const TESTCASES: TestCase[] = [
    {
        code: `
        const a = new Set([1, "a", true, ["s"]])
        for (const e of a) {
            e
        }
        `,
        type: ["Array<String>", "Boolean", "Number", "String"],
    },
    {
        code: `
        const a = new Set([1, "a", true, ["s"]])
        for (const e of a) {
            e.length
        }
        `,
        type: "Number",
    },
    {
        code: `
        const a = new Set([[1], ["s"]])
        for (const e of a) {
            for (const e2 of e) {
                e2
            }
        }
        `,
        type: ["Number", "String"],
    },
    {
        code: `
        const a = new Set([[1], [1]])
        for (const e of a) {
            for (const e2 of e) {
                e2
            }
        }
        `,
        type: "Number",
    },
    {
        code: `
        /** @returns {number} */
        function fn1() {}
        /** @returns {string} */
        function fn2() {}
        const a = new Set([fn1, fn2])
        for (const e of a) {
            e()
        }
        `,
        type: ["Number", "String"],
    },
    {
        code: `
        /** @returns {number} */
        function fn1() {}
        /** @returns {number} */
        function fn2() {}
        const a = new Set([fn1, fn2])
        for (const e of a) {
            e()
        }
        `,
        type: "Number",
    },
]
describe("type track for iterable", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
