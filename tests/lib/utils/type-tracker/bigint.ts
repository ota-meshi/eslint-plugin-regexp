import type { TestCase } from "./test-utils"
import { testTypeTrackerWithLinter } from "./test-utils"

const TESTCASES: TestCase[] = [
    {
        code: `
        BigInt(0)
        `,
        type: "BigInt",
    },
    {
        code: `
        const a = [123n,234n]
        new Set(a)
        `,
        type: "Set<BigInt>",
    },
    {
        code: `
        for (const e of 123n) {
            e
        }
        `,
        type: [],
    },
    {
        code: `123n()`,
        type: [],
    },
]
describe("type track for BigInt", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
