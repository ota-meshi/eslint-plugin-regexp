import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-non-capturing-group"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-non-capturing-group", rule as any, {
    valid: [
        `/(?:abcd)?/`,
        `/(?:)/`,
        {
            code: `/(?:a|b)/`,
            options: [{ allowTop: true }],
        },
        {
            code: `/(?:a|b)/`,
            options: [{ allowTop: "always" }],
        },
        `
        const foo = /(?:a|b)/
        const bar = new RegExp(foo.source + 'c')
        `,
        {
            code: `
            const foo = /(?:a|b)/
            const bar = new RegExp(foo.source + 'c')
            `,
            options: [{ allowTop: "partial" }],
        },
        `
        const foo = /(?:a|b)/
        const bar = new RegExp(foo.source + 'c')
        foo.exec('a')
        `,
        {
            code: `
            const foo = /(?:a|b)/
            const bar = new RegExp(foo.source + 'c')
            foo.exec('a')
            `,
            options: [{ allowTop: "partial" }],
        },
        String.raw`/()\1(?:0)/`,
        String.raw`/\1(?:0)/`,
        String.raw`/\0(?:1)/`,
        String.raw`/(\d)(?=(?:\d{3})+(?!\d))/g`,

        String(/(?:a{2})+/),
        String(/{(?:2)}/),
        String(/{(?:2,)}/),
        String(/{(?:2,5)}/),
        String(/{2,(?:5)}/),
        String(/a{(?:5})/),
        String(/\u{(?:41)}/),
        String(/(.)\1(?:2\s)/),
        String(/\0(?:2)/),
        String(/\x4(?:1)*/),
        String(/\x4(?:1)/),
        String(/(?:\x4)1/),
        String(/\x(?:4)1/),
        String(/\x(?:41\w+)/),
        String(/\u004(?:1)/),
        String(/\u00(?:4)1/),
        String(/\u0(?:0)41/),
        String(/\u(?:0)041/),
        String(/\c(?:A)/),
        String(/(?:)/),
        String(/(?:a|b)c/),
    ],
    invalid: [
        {
            code: `/(?:abcd)/`,
            output: `/abcd/`,
            errors: [
                {
                    message: "Unexpected quantifier Non-capturing group.",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 10,
                },
            ],
        },
        {
            code: `/(?:[abcd])/`,
            output: `/[abcd]/`,
            errors: [
                {
                    message: "Unexpected quantifier Non-capturing group.",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 12,
                },
            ],
        },
        {
            code: `/(?:ab|cd)/`,
            output: `/ab|cd/`,
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: `/a(?:ab|(?:.|a|b))/`,
            output: `/a(?:ab|.|a|b)/`,
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: `/(?:[abcd]+?)/`,
            output: `/[abcd]+?/`,
            errors: [
                {
                    message: "Unexpected quantifier Non-capturing group.",
                    line: 1,
                    column: 2,
                },
            ],
        },
        {
            code: String.raw`/(?:0)/; /\1(?:0)/; /(?:1)/; /\1(?:1)/`,
            output: String.raw`/0/; /\1(?:0)/; /1/; /\1(?:1)/`,
            errors: [
                {
                    message: "Unexpected quantifier Non-capturing group.",
                    line: 1,
                    column: 2,
                },
                {
                    message: "Unexpected quantifier Non-capturing group.",
                    line: 1,
                    column: 22,
                },
            ],
        },
        {
            code: String.raw`/(?:a\n)/`,
            output: String.raw`/a\n/`,
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: String.raw`
            const s = "(?:a\\n)"
            new RegExp(s)`,
            output: String.raw`
            const s = "a\\n"
            new RegExp(s)`,
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: String.raw`
            const s = "(?:a"+"\\n)"
            new RegExp(s)`,
            output: null,
            errors: ["Unexpected quantifier Non-capturing group."],
        },

        {
            code: String(/(?:a)/),
            output: String(/a/),
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: String(/(?:a)+/),
            output: String(/a+/),
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: String(/(?:\w)/),
            output: String(/\w/),
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: String(/(?:[abc])*/),
            output: String(/[abc]*/),
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: String(/foo(?:[abc]*)bar/),
            output: String(/foo[abc]*bar/),
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: String(/foo(?:bar)/),
            output: String(/foobar/),
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: String(/(?:a|b)/),
            output: String(/a|b/),
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: String(/a|(?:b|c)/),
            output: String(/a|b|c/),
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: String(/a|(?:b|c)/),
            output: String(/a|b|c/),
            options: [{ allowTop: "always" }],
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: `
            const foo = /(?:a|b)/
            const bar = new RegExp('(?:a|b)' + 'c')
            `,
            output: `
            const foo = /a|b/
            const bar = new RegExp('(?:a|b)' + 'c')
            `,
            options: [{ allowTop: "partial" }],
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: `
            const foo = /(?:a|b)/
            const bar = new RegExp(foo.source + 'c')
            `,
            output: `
            const foo = /a|b/
            const bar = new RegExp(foo.source + 'c')
            `,
            options: [{ allowTop: "never" }],
            errors: ["Unexpected quantifier Non-capturing group."],
        },
    ],
})
