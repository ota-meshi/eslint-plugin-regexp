import type { TestCase } from "./test-utils"
import { testTypeTrackerWithLinter } from "./test-utils"

const TESTCASES: TestCase[] = [
    {
        code: `
        Boolean(0)
        `,
        type: "Boolean",
    },
    {
        code: `
        const a = true
        a.valueOf()
        `,
        type: "Boolean",
    },
    {
        code: `
        Boolean.foo
        `,
        type: [],
    },
    {
        code: `
        for (const e of true) {
            e
        }
        `,
        type: [],
    },
    {
        code: `
        const a = true
        a()
        `,
        type: [],
    },
]
describe("type track for boolean", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
