import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-empty-alternative"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-empty-alternative", rule as any, {
    valid: [`/()|(?:)|(?=)/`, `/(?:)/`, `/a*|b+/`, String.raw`/[\q{a|b}]/v`],
    invalid: [
        {
            code: `/|||||/`,
            errors: [
                {
                    messageId: "empty",
                    column: 2,
                    suggestions: [
                        { messageId: "suggest", output: `/(?:||||)??/` },
                    ],
                },
            ],
        },
        {
            code: `/(a+|b+|)/`,
            errors: [
                {
                    messageId: "empty",
                    column: 8,
                    suggestions: [
                        { messageId: "suggest", output: `/((?:a+|b+)?)/` },
                    ],
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
                    column: 13,
                    suggestions: [
                        { messageId: "suggest", output: `/(?<name>(?:a|b)?)/` },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?:a|b|)f/`,
            errors: [
                {
                    messageId: "empty",
                    column: 8,
                    suggestions: [
                        { messageId: "suggest", output: `/(?:a|b)?f/` },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?:a|b|)+f/`,
            errors: [
                {
                    messageId: "empty",
                    column: 8,
                    suggestions: [
                        { messageId: "suggest", output: `/(?:(?:a|b)?)+f/` },
                    ],
                },
            ],
        },
        {
            code: String.raw`/[\q{a|}]/v`,
            errors: [
                {
                    messageId: "empty",
                    column: 7,
                    suggestions: [],
                },
            ],
        },
        {
            code: String.raw`/[\q{|a}]/v`,
            errors: [
                {
                    messageId: "empty",
                    column: 6,
                    suggestions: [],
                },
            ],
        },
        {
            code: String.raw`/[\q{a||b}]/v`,
            errors: [
                {
                    messageId: "empty",
                    column: 8,
                    suggestions: [],
                },
            ],
        },
    ],
})
