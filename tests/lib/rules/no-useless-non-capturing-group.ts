import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-useless-non-capturing-group.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-non-capturing-group", rule as any, {
    valid: [
        `/(?:abcd)?/.test(str)`,
        `/(?:)/.test(str)`,
        `/(?:a|b)/`, // UsageOfPattern.unknown
        {
            code: `/(?:a|b)/.test(str)`,
            options: [{ allowTop: true }], // backward compatibility
        },
        {
            code: `/(?:a|b)/.test(str)`,
            options: [{ allowTop: "always" }],
        },
        `
        const foo = /(?:a|b)/
        const bar = new RegExp(foo.source + 'c')
        foo.test(str)
        bar.test(str)
        `,
        {
            code: `
            const foo = /(?:a|b)/
            const bar = new RegExp(foo.source + 'c')
            foo.test(str)
            bar.test(str)
            `,
            options: [{ allowTop: "partial" }],
        },
        `
        const foo = /(?:a|b)/
        const bar = new RegExp(foo.source + 'c')
        foo.exec('a')
        bar.exec('a')
        `,
        {
            code: `
            const foo = /(?:a|b)/
            const bar = new RegExp(foo.source + 'c')
            foo.exec('a')
            bar.exec('a')
            `,
            options: [{ allowTop: "partial" }],
        },
        String.raw`/()\1(?:0)/.test(str)`,
        String.raw`/\1(?:0)/.test(str)`,
        String.raw`/\0(?:1)/.test(str)`,
        String.raw`/(\d)(?=(?:\d{3})+(?!\d))/g.test(str)`,

        `/(?:a{2})+/.test(str)`,
        `/{(?:2)}/.test(str)`,
        `/{(?:2,)}/.test(str)`,
        `/{(?:2,5)}/.test(str)`,
        `/{2,(?:5)}/.test(str)`,
        `/a{(?:5})/.test(str)`,
        `/\\u{(?:41)}/.test(str)`,
        String.raw`/(.)\1(?:2\s)/.test(str)`,
        String.raw`/\0(?:2)/.test(str)`,
        `/\\x4(?:1)*/.test(str)`,
        `/\\x4(?:1)/.test(str)`,
        `/(?:\\x4)1/.test(str)`,
        `/\\x(?:4)1/.test(str)`,
        `/\\x(?:41\\w+)/.test(str)`,
        `/\\u004(?:1)/.test(str)`,
        `/\\u00(?:4)1/.test(str)`,
        `/\\u0(?:0)41/.test(str)`,
        `/\\u(?:0)041/.test(str)`,
        String.raw`/\c(?:A)/.test(str)`,
        `/(?:a|b)c/.test(str)`,
    ],
    invalid: [
        `/(?:abcd)/.test(str)`,
        `/(?:abcd)/v.test(str)`,
        `/(?:[abcd])/.test(str)`,
        `/(?:ab|cd)/.test(str)`,
        `/a(?:ab|(?:.|a|b))/`,
        `/(?:[abcd]+?)/.test(str)`,
        String.raw`/(?:0)/.test(str); /\1(?:0)/.test(str); /(?:1)/.test(str); /\1(?:1)/.test(str)`,
        String.raw`/(?:a\n)/.test(str)`,
        String.raw`
            const s = "(?:a\\n)"
            ;(new RegExp(s)).test(str)`,
        String.raw`
            const s = "(?:a"+"\\n)"
            ;(new RegExp(s)).test(str)`,
        `/(?:a)/.test(str)`,
        String(/(?:a)+/),
        String.raw`/(?:\w)/.test(str)`,
        String(/(?:[abc])*/),
        String(/foo(?:[abc]*)bar/),
        String(/foo(?:bar)/),
        `/(?:a|b)/.test(str)`,
        String(/a|(?:b|c)/),
        {
            code: String(/a|(?:b|c)/),
            options: [{ allowTop: "always" }],
        },
        {
            code: `
            const foo = /(?:a|b)/
            const bar = new RegExp('(?:a|b)' + 'c')
            foo.exec(str)
            bar.exec(str)
            // { allowTop: "partial" }
            `,
            options: [{ allowTop: "partial" }],
        },
        {
            code: `
            const foo = /(?:a|b)/
            const bar = new RegExp(foo.source + 'c')
            foo.exec(str)
            bar.exec(str)
            // { allowTop: "never" }
            `,
            options: [{ allowTop: "never" }],
        },
    ],
})
