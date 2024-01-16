import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-useless-non-capturing-group"

const tester = new RuleTester({
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
        {
            code: `/(?:abcd)/.test(str)`,
            output: `/abcd/.test(str)`,
            errors: [
                {
                    message:
                        "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 5,
                },
            ],
        },
        {
            code: `/(?:abcd)/v.test(str)`,
            output: `/abcd/v.test(str)`,
            errors: [
                {
                    message:
                        "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 5,
                },
            ],
        },
        {
            code: `/(?:[abcd])/.test(str)`,
            output: `/[abcd]/.test(str)`,
            errors: [
                {
                    message:
                        "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 5,
                },
            ],
        },
        {
            code: `/(?:ab|cd)/.test(str)`,
            output: `/ab|cd/.test(str)`,
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: `/a(?:ab|(?:.|a|b))/`,
            output: `/a(?:ab|.|a|b)/`,
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: `/(?:[abcd]+?)/.test(str)`,
            output: `/[abcd]+?/.test(str)`,
            errors: [
                {
                    message:
                        "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
                    line: 1,
                    column: 2,
                },
            ],
        },
        {
            code: String.raw`/(?:0)/.test(str); /\1(?:0)/.test(str); /(?:1)/.test(str); /\1(?:1)/.test(str)`,
            output: String.raw`/0/.test(str); /\1(?:0)/.test(str); /1/.test(str); /\1(?:1)/.test(str)`,
            errors: [
                {
                    message:
                        "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
                    line: 1,
                    column: 2,
                },
                {
                    message:
                        "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
                    line: 1,
                    column: 42,
                },
            ],
        },
        {
            code: String.raw`/(?:a\n)/.test(str)`,
            output: String.raw`/a\n/.test(str)`,
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: String.raw`
            const s = "(?:a\\n)"
            ;(new RegExp(s)).test(str)`,
            output: String.raw`
            const s = "a\\n"
            ;(new RegExp(s)).test(str)`,
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: String.raw`
            const s = "(?:a"+"\\n)"
            ;(new RegExp(s)).test(str)`,
            output: null,
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },

        {
            code: `/(?:a)/.test(str)`,
            output: `/a/.test(str)`,
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: String(/(?:a)+/),
            output: String(/a+/),
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: String.raw`/(?:\w)/.test(str)`,
            output: String.raw`/\w/.test(str)`,
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: String(/(?:[abc])*/),
            output: String(/[abc]*/),
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: String(/foo(?:[abc]*)bar/),
            output: String(/foo[abc]*bar/),
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: String(/foo(?:bar)/),
            output: String(/foobar/),
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: `/(?:a|b)/.test(str)`,
            output: `/a|b/.test(str)`,
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: String(/a|(?:b|c)/),
            output: String(/a|b|c/),
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: String(/a|(?:b|c)/),
            output: String(/a|b|c/),
            options: [{ allowTop: "always" }],
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: `
            const foo = /(?:a|b)/
            const bar = new RegExp('(?:a|b)' + 'c')
            foo.exec(str)
            bar.exec(str)
            // { allowTop: "partial" }
            `,
            output: `
            const foo = /a|b/
            const bar = new RegExp('(?:a|b)' + 'c')
            foo.exec(str)
            bar.exec(str)
            // { allowTop: "partial" }
            `,
            options: [{ allowTop: "partial" }],
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
        {
            code: `
            const foo = /(?:a|b)/
            const bar = new RegExp(foo.source + 'c')
            foo.exec(str)
            bar.exec(str)
            // { allowTop: "never" }
            `,
            output: null,
            options: [{ allowTop: "never" }],
            errors: [
                "Unexpected unnecessary non-capturing group. This group can be removed without changing the behaviour of the regex.",
            ],
        },
    ],
})
