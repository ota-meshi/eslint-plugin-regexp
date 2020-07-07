import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-plus-quantifier"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-plus-quantifier", rule as any, {
    valid: ["/a+/", "/a+?/", "/(a+)/", "/(a+?)/", "/[a{1,}]/", "/a{1,2}/"],
    invalid: [
        {
            code: "/a{1,}/",
            output: "/a+/",
            errors: [
                {
                    message: 'Unexpected quantifier "{1,}". Use "+" instead.',
                    column: 3,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/a{1,}?/",
            output: "/a+?/",
            errors: [
                {
                    message: 'Unexpected quantifier "{1,}". Use "+" instead.',
                    column: 3,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/(a){1,}/",
            output: "/(a)+/",
            errors: [
                {
                    message: 'Unexpected quantifier "{1,}". Use "+" instead.',
                    column: 5,
                    endColumn: 9,
                },
            ],
        },
        {
            code: "/(a){1,}?/",
            output: "/(a)+?/",
            errors: [
                {
                    message: 'Unexpected quantifier "{1,}". Use "+" instead.',
                    column: 5,
                    endColumn: 9,
                },
            ],
        },
        {
            code: `
            const s = "a{1,}"
            new RegExp(s)
            `,
            output: `
            const s = "a+"
            new RegExp(s)
            `,
            errors: ['Unexpected quantifier "{1,}". Use "+" instead.'],
        },
        {
            code: `
            const s = "a{1"+",}"
            new RegExp(s)
            `,
            output: null,
            errors: ['Unexpected quantifier "{1,}". Use "+" instead.'],
        },
    ],
})
