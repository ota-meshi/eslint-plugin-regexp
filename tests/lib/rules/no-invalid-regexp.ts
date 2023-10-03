import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-invalid-regexp"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-invalid-regexp", rule as any, {
    valid: [`/regexp/`, `RegExp("(" + ")")`],
    invalid: [
        {
            code: `RegExp("(")`,
            errors: [
                {
                    message:
                        "Invalid regular expression: /(/: Unterminated group",
                    column: 9,
                    endColumn: 10,
                },
            ],
        },
        {
            code: `RegExp("(" + "(")`,
            errors: [
                {
                    message:
                        "Invalid regular expression: /((/: Unterminated group",
                    column: 15,
                    endColumn: 16,
                },
            ],
        },
        {
            code: `RegExp("[a-Z] some valid stuff")`,
            errors: [
                {
                    message:
                        "Invalid regular expression: /[a-Z] some valid stuff/: Range out of order in character class",
                    column: 12,
                    endColumn: 14,
                },
            ],
        },

        {
            code: "new RegExp(pattern, 'uu');",
            errors: [
                {
                    message: "Duplicate u flag.",
                    column: 22,
                },
            ],
        },
        {
            code: "new RegExp(pattern, 'uv');",
            errors: [
                {
                    message: "Regex 'u' and 'v' flags cannot be used together.",
                    column: 22,
                },
            ],
        },
        {
            code: "new RegExp('[A&&&]', 'v');",
            errors: [
                {
                    message:
                        "Invalid regular expression: /[A&&&]/v: Invalid character in character class",
                    column: 16,
                },
            ],
        },
    ],
})
