import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-unicode-codepoint-escapes"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-unicode-codepoint-escapes", rule as any, {
    valid: [
        `/regexp/u`,
        String.raw`/\ud83d\ude00/`,
        String.raw`/[\ud83d\ude00]/`,
        String.raw`/\u{1f600}/u`,
        String.raw`/😀/u`,
    ],
    invalid: [
        {
            code: String.raw`/\ud83d\ude00/u`,
            output: String.raw`/\u{1f600}/u`,
            errors: [
                {
                    message:
                        "Use Unicode codepoint escapes instead of Unicode escapes using surrogate pairs.",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 14,
                },
            ],
        },
        {
            code: String.raw`/[\ud83d\ude00]/u`,
            output: String.raw`/[\u{1f600}]/u`,
            errors: [
                {
                    message:
                        "Use Unicode codepoint escapes instead of Unicode escapes using surrogate pairs.",
                    line: 1,
                    column: 3,
                    endLine: 1,
                    endColumn: 15,
                },
            ],
        },
        {
            code: String.raw`/\uD83D\uDE00/u`,
            output: String.raw`/\u{1F600}/u`,
            errors: [
                "Use Unicode codepoint escapes instead of Unicode escapes using surrogate pairs.",
            ],
        },
        {
            code: String.raw`
            const s = "\\ud83d\\ude00"
            new RegExp(s, 'u')
            `,
            output: String.raw`
            const s = "\\u{1f600}"
            new RegExp(s, 'u')
            `,
            errors: [
                "Use Unicode codepoint escapes instead of Unicode escapes using surrogate pairs.",
            ],
        },
        {
            code: String.raw`
            const s = "\\ud83d"+"\\ude00"
            new RegExp(s, 'u')
            `,
            output: null,
            errors: [
                "Use Unicode codepoint escapes instead of Unicode escapes using surrogate pairs.",
            ],
        },
    ],
})
