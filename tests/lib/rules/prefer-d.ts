import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-d"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-d", rule as any, {
    valid: ["/\\d/", "/[1-9]/"],
    invalid: [
        {
            code: "/[0-9]/",
            output: "/\\d/",
            errors: [
                {
                    message:
                        'Unexpected character set "[0-9]". Use "\\d" instead.',
                    column: 2,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/[^0-9]/",
            output: "/\\D/",
            errors: [
                {
                    message:
                        'Unexpected character set "[^0-9]". Use "\\D" instead.',
                    column: 2,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/[^0-9\\w]/",
            output: "/[^\\d\\w]/",
            errors: [
                {
                    message:
                        'Unexpected character set "0-9". Use "\\d" instead.',
                    column: 4,
                    endColumn: 7,
                },
            ],
        },
        {
            code: `
            const s = "[0-9]"
            new RegExp(s)
            `,
            output: null,
            errors: ['Unexpected character set "[0-9]". Use "\\d" instead.'],
        },
    ],
})
