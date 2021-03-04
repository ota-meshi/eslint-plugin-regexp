import type { TestCase } from "./test-utils"
import { testTypeTrackerWithLinter } from "./test-utils"

const TESTCASES: TestCase[] = [
    {
        code: `
        Number('0')
        `,
        type: "Number",
    },
    {
        code: `
        const a = 123
        a.valueOf()
        `,
        type: "Number",
    },
    {
        code: `
        const a = 123
        a.toFixed()
        `,
        type: "String",
    },
    {
        code: `
        Number.EPSILON
        `,
        type: "Number",
    },
    {
        code: `
        for (const e of 123) {
            e
        }
        `,
        type: [],
    },
    {
        code: `
        const a = 123
        a()
        `,
        type: [],
    },
]
describe("type track for number", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
