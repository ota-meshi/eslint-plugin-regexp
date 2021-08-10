import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-invalid-regexp"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
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
    ],
})
