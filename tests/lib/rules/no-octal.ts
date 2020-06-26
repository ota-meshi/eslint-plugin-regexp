import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-octal"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-octal", rule as any, {
    valid: ["/\\0/", "/\\7/"],
    invalid: [
        {
            code: "/\\07/",
            errors: [
                {
                    message: 'Unexpected octal escape sequence "\\07".',
                    column: 2,
                    endColumn: 5,
                },
            ],
        },
        {
            code: "/\\077/",
            errors: [
                {
                    message: 'Unexpected octal escape sequence "\\077".',
                    column: 2,
                    endColumn: 6,
                },
            ],
        },
        {
            code: "/\\0777/",
            errors: [
                {
                    message: 'Unexpected octal escape sequence "\\077".',
                    column: 2,
                    endColumn: 6,
                },
            ],
        },
    ],
})
