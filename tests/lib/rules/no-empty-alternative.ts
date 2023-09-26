import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-empty-alternative"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-empty-alternative", rule as any, {
    valid: [`/()|(?:)|(?=)/`, `/(?:)/`, `/a*|b+/`],
    invalid: [
        {
            code: `/|||||/`,
            errors: [
                {
                    messageId: "empty",
                    column: 2,
                    suggestions: [{ output: `/(?:||||)??/` }],
                },
            ],
        },
        {
            code: `/(a+|b+|)/`,
            errors: [
                {
                    messageId: "empty",
                    column: 8,
                    suggestions: [{ output: `/((?:a+|b+)?)/` }],
                },
            ],
        },
        {
            code: String.raw`/(?:\|\|||\|)/`,
            errors: [
                {
                    messageId: "empty",
                    column: 10,
                    suggestions: [],
                },
            ],
        },
        {
            code: String.raw`/(?<name>a|b|)/`,
            errors: [
                {
                    messageId: "empty",
                    suggestions: [{ output: String.raw`/(?<name>(?:a|b)?)/` }],
                },
            ],
        },
        {
            code: String.raw`/(?:a|b|)f/`,
            errors: [
                {
                    messageId: "empty",
                    suggestions: [{ output: String.raw`/(?:a|b)?f/` }],
                },
            ],
        },
        {
            code: String.raw`/(?:a|b|)+f/`,
            errors: [
                {
                    messageId: "empty",
                    suggestions: [{ output: String.raw`/(?:(?:a|b)?)+f/` }],
                },
            ],
        },
    ],
})
