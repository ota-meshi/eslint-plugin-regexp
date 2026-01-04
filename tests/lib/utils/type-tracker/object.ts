import type { TestCase } from "./test-utils.ts"
import { testTypeTrackerWithLinter } from "./test-utils.ts"

const TESTCASES: TestCase[] = [
    {
        code: `
        const a = new Object()
        a.foo
        `,
        type: [],
    },
    {
        code: `
        const a1 = {a:true}
        const a2 = {a:'str'}
        const a3 = {b:123, ...a1, ...a2}
        a3.a
        `,
        type: "String",
    },
    {
        code: `
        const a1 = {a:true}
        const a2 = {a:'str'}
        const a3 = {b:123, ...a1, ...a2}
        a3.b
        `,
        type: "Number",
    },
    {
        code: `
        const o = {a:true,b:123}
        for (const e of o) {
            e
        }
        `,
        type: [],
    },
    {
        code: `
        const o = {a:true,b:123}
        o()
        `,
        type: [],
    },
    {
        code: `
        const o1 = {a:true,b:123}
        const o2 = {a:false,b:42}
        const s = new Set([o1,o2])
        for (const e of s) {
            e.a
        }
        `,
        type: "Boolean",
    },
    {
        code: `
        const o1 = {a:true,b:123,c:'a'}
        const o2 = {a:false,b:42}
        const s = new Set([o1,o2])
        for (const e of s) {
            e.a
        }
        `,
        type: "Boolean",
    },
    {
        code: `
        const o1 = {a:true,b:123}
        const o2 = {a:'a',b:42}
        const s = new Set([o1,o2])
        for (const e of s) {
            e.a
        }
        `,
        type: ["Boolean", "String"],
    },
    {
        code: `
        const m = new Map([[1,{a:true,b:123}],[2,{a:false,b:42}]])
        m.get(1).a
        `,
        type: "Boolean",
    },
    {
        code: `
        const m = new Map([[1,{a:true,b:123}],[2,{b:42, a:false}]])
        m.get(1).a
        `,
        type: "Boolean",
    },
    {
        code: `
        const m = new Map([[1,{a:'str',b:123}],[2,{a:false,b:42}]])
        m.get(1).a
        `,
        type: [],
    },
    {
        code: `
        const m = new Map([[1,{a:true,b:123}],[2,{c:'a', b:123, a:false}]])
        m.get(1).a
        `,
        type: [],
    },
    {
        code: `
        Object('a')
        `,
        type: "String",
    },
    {
        code: `
        Object(a)
        `,
        type: "Object",
    },
]
describe("type track for object", () => {
    for (const testCase of TESTCASES) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
