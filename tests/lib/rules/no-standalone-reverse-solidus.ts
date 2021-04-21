import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-standalone-reverse-solidus"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-standalone-reverse-solidus", rule as any, {
    valid: [String.raw`/\cX/`],
    invalid: [
        {
            code: String.raw`/\c/`,
            errors: [
                {
                    message:
                        "Unexpected standalone reverse solidus (`\\`). It looks like an escape sequence, but it's a single `\\` character pattern.",
                    column: 2,
                },
            ],
        },
        {
            code: String.raw`/\c-/`,
            errors: [
                {
                    message:
                        "Unexpected standalone reverse solidus (`\\`). It looks like an escape sequence, but it's a single `\\` character pattern.",
                    column: 2,
                },
            ],
        },
        {
            code: String.raw`/\c1/`,
            errors: [
                {
                    message:
                        "Unexpected standalone reverse solidus (`\\`). It looks like an escape sequence, but it's a single `\\` character pattern.",
                    column: 2,
                },
            ],
        },
        {
            code: String.raw`/[\c]/`,
            errors: [
                {
                    message:
                        "Unexpected standalone reverse solidus (`\\`). It looks like an escape sequence, but it's a single `\\` character pattern.",
                    column: 3,
                },
            ],
        },
    ],
})
