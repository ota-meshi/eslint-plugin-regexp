import type { TestCase } from "./test-utils"
import { testTypeTrackerWithLinter } from "./test-utils"
import * as tsParser from "@typescript-eslint/parser"

const TESTCASES: TestCase[] = [
    {
        code: `
        const s: 'a' | 'b' | false = a
        s
        `,
        type: ["Boolean", "String"],
        languageOptions: {
            parser: tsParser,
        },
    },
    {
        code: `
        const r: {[key:string]:string} = {foo:'s'}
        const a = r.foo; a
        `,
        type: "String",
        languageOptions: {
            parser: tsParser,
        },
    },
    {
        code: `
        const r: {[key:string]:string} = {foo:'s'}
        r
        `,
        type: "Object",
        languageOptions: {
            parser: tsParser,
        },
    },
    {
        code: `
        type A = 42 | 'foo' | 42n
        const r: A = a
        r
        `,
        type: ["BigInt", "Number", "String"],
        languageOptions: {
            parser: tsParser,
        },
    },
    {
        code: `
        type A = 42 | 'foo' | 42n
        const r: A = a
        const b = (r as any);
        b;
        `,
        type: [],
        languageOptions: {
            parser: tsParser,
        },
    },
    {
        code: `
        const b = [1,2,3]
        const c = b;
        c
        `,
        type: "Array",
        languageOptions: {
            parser: tsParser,
        },
    },
    {
        code: `
        const b = [1,2,3] as const
        const c = b;
        c
        `,
        type: "Array",
        languageOptions: {
            parser: tsParser,
        },
    },
    {
        code: `
        const b: ReadonlyArray<String> = a
        const c = b;
        c
        `,
        type: "Array",
        languageOptions: {
            parser: tsParser,
        },
    },
]
describe("type track with typescript", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
