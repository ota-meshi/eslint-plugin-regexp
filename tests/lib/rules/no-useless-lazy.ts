import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-lazy"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-lazy", rule as any, {
    valid: [
        `/a*?/`,
        `/a+?/`,
        `/a{4,}?/`,
        `/a{2,4}?/`,
        `/a{2,2}/`,
        `/a{3}/`,
        `/a+?b*/`,
        `/[\\s\\S]+?bar/`,
        `/a??a?/`,
    ],
    invalid: [
        {
            code: `/a{1}?/`,
            output: `/a{1}/`,
            errors: [
                {
                    messageId: "constant",
                    line: 1,
                    column: 6,
                    endLine: 1,
                    endColumn: 7,
                },
            ],
        },
        {
            code: `/a{1}?/v`,
            output: `/a{1}/v`,
            errors: [{ messageId: "constant" }],
        },
        {
            code: `/a{4}?/`,
            output: `/a{4}/`,
            errors: [
                {
                    messageId: "constant",
                    line: 1,
                    column: 6,
                    endLine: 1,
                    endColumn: 7,
                },
            ],
        },
        {
            code: `/a{2,2}?/`,
            output: `/a{2,2}/`,
            errors: [{ messageId: "constant" }],
        },
        {
            code: String.raw`const s = "\\d{1}?"
            new RegExp(s)`,
            output: String.raw`const s = "\\d{1}"
            new RegExp(s)`,
            errors: [{ messageId: "constant" }],
        },
        {
            code: String.raw`const s = "\\d"+"{1}?"
            new RegExp(s)`,
            output: String.raw`const s = "\\d"+"{1}"
            new RegExp(s)`,
            errors: [{ messageId: "constant" }],
        },

        {
            code: `/a+?b+/`,
            output: `/a+b+/`,
            errors: [{ messageId: "possessive" }],
        },
        {
            code: String.raw`/[\q{aa|ab}]+?b+/v`,
            output: String.raw`/[\q{aa|ab}]+b+/v`,
            errors: [{ messageId: "possessive" }],
        },
        {
            code: `/a*?b+/`,
            output: `/a*b+/`,
            errors: [{ messageId: "possessive" }],
        },
        {
            code: `/(?:a|cd)+?(?:b+|zzz)/`,
            output: `/(?:a|cd)+(?:b+|zzz)/`,
            errors: [{ messageId: "possessive" }],
        },

        {
            code: String.raw`/\b\w+?(?=\W)/`,
            output: String.raw`/\b\w+(?=\W)/`,
            errors: [{ messageId: "possessive" }],
        },
        {
            code: String.raw`/\b\w+?(?!\w)/`,
            output: String.raw`/\b\w+(?!\w)/`,
            errors: [{ messageId: "possessive" }],
        },
        {
            code: String.raw`/\b\w+?\b/`,
            output: String.raw`/\b\w+\b/`,
            errors: [{ messageId: "possessive" }],
        },
        {
            code: String.raw`/\b\w+?$/`,
            output: String.raw`/\b\w+$/`,
            errors: [{ messageId: "possessive" }],
        },
    ],
})
