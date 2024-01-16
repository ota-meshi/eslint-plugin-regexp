import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-octal"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-octal", rule as any, {
    valid: ["/\\0/", "/[\\7]/", "/[\\1-\\4]/", String.raw`/[\q{\0}]/v`],
    invalid: [
        {
            code: "/\\07/",
            errors: [
                {
                    message: "Unexpected octal escape sequence '\\07'.",
                    column: 2,
                    endColumn: 5,
                    suggestions: [
                        {
                            desc: "Replace the octal escape sequence with a hexadecimal escape sequence.",
                            output: String.raw`/\x07/`,
                        },
                    ],
                },
            ],
        },
        {
            code: "/\\077/",
            errors: [
                {
                    message: "Unexpected octal escape sequence '\\077'.",
                    column: 2,
                    endColumn: 6,
                    suggestions: [
                        {
                            desc: "Replace the octal escape sequence with a hexadecimal escape sequence.",
                            output: String.raw`/\x3f/`,
                        },
                    ],
                },
            ],
        },
        {
            code: "/[\\077]/",
            errors: [
                {
                    message: "Unexpected octal escape sequence '\\077'.",
                    suggestions: [
                        {
                            desc: "Replace the octal escape sequence with a hexadecimal escape sequence.",
                            output: String.raw`/[\x3f]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: "/\\0777/",
            errors: [
                {
                    message: "Unexpected octal escape sequence '\\077'.",
                    column: 2,
                    endColumn: 6,
                    suggestions: [
                        {
                            desc: "Replace the octal escape sequence with a hexadecimal escape sequence.",
                            output: String.raw`/\x3f7/`,
                        },
                    ],
                },
            ],
        },
        {
            code: "/\\7/",
            errors: [
                {
                    message: "Unexpected octal escape sequence '\\7'.",
                    suggestions: [
                        {
                            desc: "Replace the octal escape sequence with a hexadecimal escape sequence.",
                            output: String.raw`/\x07/`,
                        },
                    ],
                },
            ],
        },
        {
            code: "/\\1\\2/",
            errors: [
                {
                    message: "Unexpected octal escape sequence '\\1'.",
                    suggestions: [
                        {
                            desc: "Replace the octal escape sequence with a hexadecimal escape sequence.",
                            output: String.raw`/\x01\2/`,
                        },
                    ],
                },
                {
                    message: "Unexpected octal escape sequence '\\2'.",
                    suggestions: [
                        {
                            desc: "Replace the octal escape sequence with a hexadecimal escape sequence.",
                            output: String.raw`/\1\x02/`,
                        },
                    ],
                },
            ],
        },
        {
            code: "/()\\1\\2/",
            errors: [
                {
                    message: "Unexpected octal escape sequence '\\2'.",
                    suggestions: [
                        {
                            desc: "Replace the octal escape sequence with a hexadecimal escape sequence.",
                            output: String.raw`/()\1\x02/`,
                        },
                    ],
                },
            ],
        },
    ],
})
