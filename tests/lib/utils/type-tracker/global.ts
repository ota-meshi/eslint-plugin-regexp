import type { TestCase } from "./test-utils"
import { testTypeTrackerWithLinter } from "./test-utils"

const TESTCASES: TestCase[] = [
    {
        code: `
        const m = globalThis
        m
        `,
        type: "Global",
    },
    {
        code: `
        globalThis.BigInt(1)
        `,
        type: "BigInt",
    },
    {
        code: `
        globalThis(1)
        `,
        type: [],
    },
    {
        code: `
        for (const e of globalThis) {
            e
        }
        `,
        type: [],
    },
]
describe("type track for global", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
