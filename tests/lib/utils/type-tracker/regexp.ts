import type { TestCase } from "./test-utils"
import { testTypeTrackerWithLinter } from "./test-utils"

const TESTCASES: TestCase[] = [
    {
        code: `
        RegExp('a')
        `,
        type: "RegExp",
    },
    {
        code: `
        RegExp.lastMatch
        `,
        type: "Number",
    },
    {
        code: `
        for (const e of /a/) {
            e
        }
        `,
        type: [],
    },
    {
        code: `
        const a = /a/
        a()
        `,
        type: [],
    },
]
describe("type track for RegExp", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
