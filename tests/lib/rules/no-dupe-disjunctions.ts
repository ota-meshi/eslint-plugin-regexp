import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-dupe-disjunctions"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-dupe-disjunctions", rule as any, {
    valid: [
        `/a|b/`,
        `/(a|b)/`,
        `/(?:a|b)/`,
        `/(?:(a)|(a))/`,
        `/((?:ab|ba)|(?:ba|ac))/`,
    ],
    invalid: [
        {
            code: `/a|a/`,
            errors: [
                {
                    message: "The disjunctions are duplicated.",
                    line: 1,
                    column: 4,
                    endLine: 1,
                    endColumn: 5,
                },
            ],
        },
        {
            code: `/(a|a)/`,
            errors: [
                {
                    message: "The disjunctions are duplicated.",
                    line: 1,
                    column: 5,
                    endLine: 1,
                    endColumn: 6,
                },
            ],
        },
        {
            code: `/(?:a|a)/`,
            errors: [
                {
                    message: "The disjunctions are duplicated.",
                    line: 1,
                    column: 7,
                    endLine: 1,
                    endColumn: 8,
                },
            ],
        },
        {
            code: `/(?:[ab]|[ab])/`,
            errors: ["The disjunctions are duplicated."],
        },
        {
            code: `/(?:[ab]|[ba])/`,
            errors: ["The disjunctions are duplicated."],
        },
        {
            code: String.raw`/(?:[\da-z]|[a-z\d])/`,
            errors: ["The disjunctions are duplicated."],
        },
        {
            code: `/((?:ab|ba)|(?:ab|ba))/`,
            errors: ["The disjunctions are duplicated."],
        },
        {
            code: `/((?:ab|ba)|(?:ba|ab))/`,
            errors: ["The disjunctions are duplicated."],
        },
    ],
})
