import { RuleTester } from "eslint"
import rule from "../../../lib/rules/confusing-quantifier"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("confusing-quantifier", rule as any, {
    valid: [
        String.raw`/a+/`,
        String.raw`/a?/`,
        String.raw`/(a|b?)*/`,
        String.raw`/(a?){0,3}/`,
        String.raw`/(a|\b)+/`,
    ],
    invalid: [
        {
            code: String.raw`/(a?){5}/`,
            errors: [
                {
                    message:
                        "This quantifier is confusing because its minimum is 5 but it can match the empty string. Maybe replace it with `{0,5}` to reflect that it can match the empty string?",
                    line: 1,
                    column: 6,
                },
            ],
        },
        {
            code: String.raw`/(?:a?b*|c+){4}/`,
            errors: [
                {
                    message:
                        "This quantifier is confusing because its minimum is 4 but it can match the empty string. Maybe replace it with `{0,4}` to reflect that it can match the empty string?",
                    line: 1,
                    column: 13,
                },
            ],
        },
    ],
})
