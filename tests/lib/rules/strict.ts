import { RuleTester } from "eslint"
import rule from "../../../lib/rules/strict"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("strict", rule as any, {
    valid: [`/regexp/`, String.raw`/\{\}\]/`],
    invalid: [
        {
            code: `/]/`,
            errors: [
                {
                    message:
                        "Invalid regular expression: /]/: Lone quantifier brackets.",
                    line: 1,
                    column: 1,
                },
            ],
        },
        {
            code: `/{/`,
            errors: [
                {
                    message:
                        "Invalid regular expression: /{/: Lone quantifier brackets.",
                    line: 1,
                    column: 1,
                },
            ],
        },
        {
            code: `/}/`,
            errors: [
                {
                    message:
                        "Invalid regular expression: /}/: Lone quantifier brackets.",
                    line: 1,
                    column: 1,
                },
            ],
        },
        {
            code: String.raw`/\u{42}/`,
            errors: [
                {
                    message:
                        "Invalid regular expression: /\\u{42}/: Invalid unicode escape.",
                    line: 1,
                    column: 1,
                },
            ],
        },
    ],
})
