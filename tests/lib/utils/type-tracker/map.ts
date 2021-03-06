import type { TestCase } from "./test-utils"
import { testTypeTrackerWithLinter } from "./test-utils"

const TESTCASES: TestCase[] = [
    {
        code: `
        /** @type {Map<string, number>} */
        const a = new Map()
        a.set('a', b)
        `,
        type: "Map<String,Number>",
    },
    {
        code: `
        /** @type {Map<string, number>} */
        const a = new Map()
        for (const e of a) {
            e
        }
        `,
        type: "Array<Number|String>",
    },
    {
        code: `
        /** @type {Map<string, number>} */
        const a = new Map()
        for (const e of a.entries()) {
            e
        }
        `,
        type: "Array<Number|String>",
    },
    {
        code: `
        const a = new Map()
        for (const e of a.entries()) {
            e
        }
        `,
        type: "Array",
    },
    {
        code: `
        /** @type {Map<string, number>} */
        const a = new Map()
        for (const e of a.keys()) {
            e
        }
        `,
        type: "String",
    },
    {
        code: `
        /** @type {Map<string, number>} */
        const a = new Map()
        for (const e of a.values()) {
            e
        }
        `,
        type: "Number",
    },
    {
        code: `
        /** @type {Map<string, number>} */
        const a = new Map()
        a()
        `,
        type: [],
    },
    {
        code: `
        /** @type {Map<string, number>} */
        const a = new Map()
        /** @type {Map<string, number>} */
        const b = new Map()
        for (const e of [a,b]) {
            e
        }
        `,
        type: "Map<String,Number>",
    },
    {
        code: `
        const a = new Map([[1,'a'],[2,'b']])
        const arr = [...a]
        arr
        `,
        type: "Array<Array<Number|String>>",
    },
    {
        code: `
        const a = new Map([[1,'a'],[2,'b']])
        const arr = [...a]
        new Map(arr)
        `,
        type: "Map<Number,String>",
    },
    {
        code: `
        Map.foo
        `,
        type: [],
    },
]
describe("type track for Map", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
