import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-useless-set-operand"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-set-operand", rule as any, {
    valid: [String.raw`/[\w--\d]/v`],
    invalid: [
        {
            code: String.raw`/[\w&&\d]/v`,
            output: String.raw`/[\d]/v`,
            errors: [
                "'\\d' is a subset of '\\w', so the result of the intersection is always going to be '\\d'.",
            ],
        },
        {
            code: String.raw`/[\w&&\s]/v`,
            output: String.raw`/[]/v`,
            errors: [
                "'\\w' and '\\s' are disjoint, so the result of the intersection is always going to be the empty set.",
            ],
        },
        {
            code: String.raw`/[^\w&&\s]/v`,
            output: String.raw`/[^]/v`,
            errors: [
                "'\\w' and '\\s' are disjoint, so the result of the intersection is always going to be the empty set.",
            ],
        },
        {
            code: String.raw`/[\w&&[\d\s]]/v`,
            output: String.raw`/[\w&&[\d]]/v`,
            errors: [
                "'\\s' can be removed without changing the result of the subtraction.",
            ],
        },
        {
            code: String.raw`/[\w&&[^\d\s]]/v`,
            output: String.raw`/[\w&&[^\d]]/v`,
            errors: [
                "'\\s' can be removed without changing the result of the subtraction.",
            ],
        },
        {
            code: String.raw`/[\w--\s]/v`,
            output: String.raw`/[\w]/v`,
            errors: [
                "'\\w' and '\\s' are disjoint, so the subtraction doesn't do anything.",
            ],
        },
        {
            code: String.raw`/[\d--\w]/v`,
            output: String.raw`/[]/v`,
            errors: [
                "'\\d' is a subset of '\\w', so the result of the subtraction is always going to be the empty set.",
            ],
        },
        {
            code: String.raw`/[^\d--\w]/v`,
            output: String.raw`/[^]/v`,
            errors: [
                "'\\d' is a subset of '\\w', so the result of the subtraction is always going to be the empty set.",
            ],
        },
        {
            code: String.raw`/[\w--[\d\s]]/v`,
            output: String.raw`/[\w--[\d]]/v`,
            errors: [
                "'\\s' can be removed without changing the result of the subtraction.",
            ],
        },
        {
            code: String.raw`/[\w--[^\d\s]]/v`,
            output: String.raw`/[\w--[^\d]]/v`,
            errors: [
                "'\\s' can be removed without changing the result of the subtraction.",
            ],
        },
        {
            code: String.raw`/[\w--[a\q{aa|b}]]/v`,
            output: String.raw`/[\w--[a\q{b}]]/v`,
            errors: [
                "'aa' can be removed without changing the result of the subtraction.",
            ],
        },
        {
            code: String.raw`/[\w--[a\q{aa}]]/v`,
            output: String.raw`/[\w--[a]]/v`,
            errors: [
                "'aa' can be removed without changing the result of the subtraction.",
            ],
        },
        {
            code: String.raw`/[\w--\q{a|aa}]/v`,
            output: String.raw`/[\w--\q{a}]/v`,
            errors: [
                "'aa' can be removed without changing the result of the subtraction.",
            ],
        },
    ],
})
