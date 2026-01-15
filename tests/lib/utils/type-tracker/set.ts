import type { TestCase } from "./test-utils.ts"
import { testTypeTrackerWithLinter } from "./test-utils.ts"

const TESTCASES: TestCase[] = [
    {
        code: `
        /** @type {Set<string>} */
        const a = new Set()
        a.add(b)
        `,
        type: "Set<String>",
    },
    {
        code: `
        /** @type {Set<string>} */
        const a = new Set()
        for (const e of a) {
            e
        }
        `,
        type: "String",
    },
    {
        code: `
        /** @type {Set<string>} */
        const a = new Set()
        for (const e of a.entries()) {
            e
        }
        `,
        type: "Array<String>",
    },
    {
        code: `
        const a = new Set()
        for (const e of a.entries()) {
            e
        }
        `,
        type: "Array",
    },
    {
        code: `
        /** @type {Set<string>} */
        const a = new Set()
        for (const e of a.keys()) {
            e
        }
        `,
        type: "String",
    },
    {
        code: `
        /** @type {Set<string>} */
        const a = new Set()
        for (const e of a.values()) {
            e
        }
        `,
        type: "String",
    },
    {
        code: `
        /** @type {Set<string>} */
        const a = new Set()
        a()
        `,
        type: [],
    },
    {
        code: `
        /** @type {Set<string>} */
        const a = new Set()
        /** @type {Set<string>} */
        const b = new Set()
        for (const e of [a,b]) {
            e
        }
        `,
        type: "Set<String>",
    },
    {
        code: `
        const a = new Set([1,2,3,4,5])
        const arr = [...a]
        arr
        `,
        type: "Array<Number>",
    },
    {
        code: `
        const a = new Set([1,2,3,4,5])
        const arr = [...a]
        new Set(arr)
        `,
        type: "Set<Number>",
    },
    {
        code: `
        Set.foo
        `,
        type: [],
    },
]
describe("type track for Set", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
