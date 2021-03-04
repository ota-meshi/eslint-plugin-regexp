import type { TestCase } from "./test-utils"
import { testTypeTrackerWithLinter } from "./test-utils"

const TESTCASES: TestCase[] = [
    {
        code: `
        const s: 'a' | 'b' | false = a
        s
        `,
        type: ["Boolean", "String"],
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        const r: {[key:string]:string} = {foo:'s'}
        const a = r.foo; a
        `,
        type: "String",
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        const r: {[key:string]:string} = {foo:'s'}
        r
        `,
        type: "Object",
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        type A = 42 | 'foo' | 42n
        const r: A = a
        r
        `,
        type: ["BigInt", "Number", "String"],
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        type A = 42 | 'foo' | 42n
        const r: A = a
        const b = (r as any);
        b;
        `,
        type: [],
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        const b = [1,2,3]
        const c = b;
        c
        `,
        type: "Array",
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        const b = [1,2,3] as const
        const c = b;
        c
        `,
        type: "Array",
        parser: "@typescript-eslint/parser",
    },
    {
        code: `
        const b: ReadonlyArray<String> = a
        const c = b;
        c
        `,
        type: "Array",
        parser: "@typescript-eslint/parser",
    },
]
describe("type track with typescript", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
