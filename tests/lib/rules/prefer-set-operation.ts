import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/prefer-set-operation"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-set-operation", rule as any, {
    valid: [
        String.raw`/a\b/`,
        String.raw`/a\b/u`,
        String.raw`/a\b/v`,
        String.raw`/(?!a)\w/`,
        String.raw`/(?!a)\w/u`,
    ],
    invalid: [
        {
            code: String.raw`/(?!a)\w/v`,
            output: String.raw`/[\w--a]/v`,
            errors: [
                "This lookaround can be combined with '\\w' using a set operation.",
            ],
        },
        {
            code: String.raw`/\w(?<=\d)/v`,
            output: String.raw`/[\w&&\d]/v`,
            errors: [
                "This lookaround can be combined with '\\w' using a set operation.",
            ],
        },
        {
            code: String.raw`/(?!-)&/v`,
            output: String.raw`/[\&--\-]/v`,
            errors: [
                "This lookaround can be combined with '&' using a set operation.",
            ],
        },
    ],
})
