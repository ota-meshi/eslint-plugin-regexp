import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-empty-string-literal"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-empty-string-literal", rule as any, {
    valid: [
        String.raw`/[\q{a}]/v`,
        String.raw`/[\q{abc}]/v`,
        String.raw`/[\q{a|}]/v`,
        String.raw`/[\q{abc|}]/v`,
        String.raw`/[\q{|a}]/v`,
        String.raw`/[\q{|abc}]/v`,
    ],
    invalid: [
        {
            code: String.raw`/[\q{}]/v`,
            errors: [
                {
                    message: "Unexpected empty string literal.",
                    column: 3,
                    endColumn: 7,
                },
            ],
        },
        {
            code: String.raw`/[\q{|}]/v`,
            errors: [
                {
                    message: "Unexpected empty string literal.",
                    column: 3,
                    endColumn: 8,
                },
            ],
        },
    ],
})
