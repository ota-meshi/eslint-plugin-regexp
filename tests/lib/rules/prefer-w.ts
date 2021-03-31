import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-w"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-w", rule as any, {
    valid: ["/\\w/"],
    invalid: [
        {
            code: "/[0-9a-zA-Z_]/",
            output: "/\\w/",
            errors: [
                {
                    message:
                        'Unexpected character class "[0-9a-zA-Z_]". Use "\\w" instead.',
                    column: 2,
                    endColumn: 14,
                },
            ],
        },
        {
            code: "/[0-9a-zA-Z_#]/",
            output: "/[\\w#]/",
            errors: [
                {
                    message:
                        'Unexpected character class ranges "[0-9a-zA-Z_]". Use "\\w" instead.',
                    column: 2,
                    endColumn: 15,
                },
            ],
        },
        {
            code: "/[0-9a-z_]/i",
            output: "/\\w/i",
            errors: [
                'Unexpected character class "[0-9a-z_]". Use "\\w" instead.',
            ],
        },
        {
            code: "/[^0-9a-zA-Z_]/",
            output: "/\\W/",
            errors: [
                'Unexpected character class "[^0-9a-zA-Z_]". Use "\\W" instead.',
            ],
        },
        {
            code: "/[^0-9A-Z_]/i",
            output: "/\\W/i",
            errors: [
                'Unexpected character class "[^0-9A-Z_]". Use "\\W" instead.',
            ],
        },
        {
            code: `
            const s = "[0-9A-Z_]"
            new RegExp(s, 'i')
            `,
            output: `
            const s = "\\\\w"
            new RegExp(s, 'i')
            `,
            errors: [
                'Unexpected character class "[0-9A-Z_]". Use "\\w" instead.',
            ],
        },
        {
            code: `
            const s = "[0-9"+"A-Z_]"
            new RegExp(s, 'i')
            `,
            output: null,
            errors: [
                'Unexpected character class "[0-9A-Z_]". Use "\\w" instead.',
            ],
        },
        {
            code: `
            const s = "[0-9A-Z_c]"
            new RegExp(s, 'i')
            `,
            output: `
            const s = "[\\\\wc]"
            new RegExp(s, 'i')
            `,
            errors: [
                'Unexpected character class ranges "[0-9A-Z_]". Use "\\w" instead.',
            ],
        },
        {
            code: `
            const s = "[0-9"+"A-Z_c]"
            new RegExp(s, 'i')
            `,
            output: null,
            errors: [
                'Unexpected character class ranges "[0-9A-Z_]". Use "\\w" instead.',
            ],
        },
    ],
})
