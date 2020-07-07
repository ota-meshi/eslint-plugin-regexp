import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-t"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-t", rule as any, {
    valid: ["/\\t/", "new RegExp('\t')"],
    invalid: [
        {
            code: "/\\u0009/",
            output: "/\\t/",
            errors: [
                {
                    message:
                        'Unexpected character "\\u0009". Use "\\t" instead.',
                    column: 2,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/\t/",
            output: "/\\t/",
            errors: [
                {
                    message: 'Unexpected character "\t". Use "\\t" instead.',
                    column: 2,
                    endColumn: 3,
                },
            ],
        },
        {
            code: `
            const s = "\\\\u0009"
            new RegExp(s)
            `,
            output: null,
            errors: ['Unexpected character "\\u0009". Use "\\t" instead.'],
        },
    ],
})
