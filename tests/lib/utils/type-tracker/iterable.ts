import type { TestCase } from "./test-utils.ts"
import { testTypeTrackerWithLinter } from "./test-utils.ts"

const TESTCASES: TestCase[] = [
    {
        code: `
        const m = new Map([[1,"a"],[2,"b"]])
        const itr = m.keys()
        itr
        `,
        type: "Iterable<Number>",
    },
    {
        code: `
        const m = new Map([[1,"a"],[2,"b"]])
        const itr = m.keys()
        itr.foo
        `,
        type: [],
    },
    {
        code: `
        const m = new Map([[1,"a"],[2,"b"]])
        const itr = m.keys()
        itr()
        `,
        type: [],
    },
    {
        code: `
        const m = new Map([[1,"a"],[2,"b"]])
        const itr1 = m.keys()
        const itr2 = m.keys()
        const m2 = new Map([[1,itr1],[2,itr2]])
        m2.get(1)
        `,
        type: "Iterable<Number>",
    },
]
describe("type track for iterable", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
