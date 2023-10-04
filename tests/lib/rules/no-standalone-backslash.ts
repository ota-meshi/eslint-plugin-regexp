import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-standalone-backslash"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-standalone-backslash", rule as any, {
    valid: [String.raw`/\cX/`, String.raw`/[[\cA-\cZ]--\cX]/v`],
    invalid: [
        {
            code: String.raw`/\c/`,
            errors: [
                {
                    message:
                        "Unexpected standalone backslash (`\\`). It looks like an escape sequence, but it's a single `\\` character pattern.",
                    column: 2,
                },
            ],
        },
        {
            code: String.raw`/\c-/`,
            errors: [
                {
                    message:
                        "Unexpected standalone backslash (`\\`). It looks like an escape sequence, but it's a single `\\` character pattern.",
                    column: 2,
                },
            ],
        },
        {
            code: String.raw`/\c1/`,
            errors: [
                {
                    message:
                        "Unexpected standalone backslash (`\\`). It looks like an escape sequence, but it's a single `\\` character pattern.",
                    column: 2,
                },
            ],
        },
        {
            code: String.raw`/[\c]/`,
            errors: [
                {
                    message:
                        "Unexpected standalone backslash (`\\`). It looks like an escape sequence, but it's a single `\\` character pattern.",
                    column: 3,
                },
            ],
        },
    ],
})
