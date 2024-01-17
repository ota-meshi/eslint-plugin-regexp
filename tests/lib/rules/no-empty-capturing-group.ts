import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-empty-capturing-group"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-empty-capturing-group", rule as any, {
    valid: ["/(a)/", "/a(\\bb)/", "/a(\\b|b)/", String.raw`/a([\q{a}])/v`],
    invalid: [
        {
            code: "/a(\\b)/",
            errors: [
                {
                    message: "Unexpected capture empty.",
                    column: 3,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/a($)/",
            errors: [
                {
                    message: "Unexpected capture empty.",
                    column: 3,
                    endColumn: 6,
                },
            ],
        },
        {
            code: "/(^)a/",
            errors: [
                {
                    message: "Unexpected capture empty.",
                    column: 2,
                    endColumn: 5,
                },
            ],
        },
        {
            code: "/()a/",
            errors: [
                {
                    message: "Unexpected capture empty.",
                    column: 2,
                    endColumn: 4,
                },
            ],
        },
        {
            code: "/(\\b\\b|(?:\\B|$))a/",
            errors: ["Unexpected capture empty."],
        },
        {
            code: String.raw`/a([\q{}])/v`,
            errors: [
                {
                    message: "Unexpected capture empty.",
                    line: 1,
                },
            ],
        },
    ],
})
