import { RuleTester } from "eslint"
import rule from "../../../lib/rules/unicode-escape"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("unicode-escape", rule as any, {
    valid: [
        String.raw`/a \x0a \cM \0 \u{ff} \u{100} \ud83d\ude00 \u{1f600}/u`,
        {
            code: String.raw`/a \x0a \cM \0 \u{ff} \u{100} \ud83d\ude00 \u{1f600}/u`,
            options: ["unicodeCodePointEscape"],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u0100 \u00ff \ud83d\ude00 \u{1f600}/u`,
            options: ["unicodeEscape"],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u{ff} \u{100} \ud83d\ude00 \u{1f600}/v`,
            options: ["unicodeCodePointEscape"],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u0100 \u00ff \ud83d\ude00 \u{1f600}/v`,
            options: ["unicodeEscape"],
        },

        // no u flag
        {
            code: String.raw`/a \x0a \cM \0 \u0100 \u00ff \ud83d\ude00 \u{1f600}/`,
            options: ["unicodeCodePointEscape"],
        },
    ],
    invalid: [
        {
            code: String.raw`/a \x0a \cM \0 \u0100 \u00ff \ud83d\ude00 \u{1f600}/u`,
            output: String.raw`/a \x0a \cM \0 \u{100} \u{ff} \ud83d\ude00 \u{1f600}/u`,
            errors: [
                {
                    message:
                        "Expected unicode code point escape ('\\u{100}'), but unicode escape ('\\u0100') is used.",
                    column: 16,
                },
                {
                    message:
                        "Expected unicode code point escape ('\\u{ff}'), but unicode escape ('\\u00ff') is used.",
                    column: 23,
                },
            ],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u0100 \u00ff \ud83d\ude00 \u{1f600}/u`,
            output: String.raw`/a \x0a \cM \0 \u{100} \u{ff} \ud83d\ude00 \u{1f600}/u`,
            options: ["unicodeCodePointEscape"],
            errors: [
                {
                    message:
                        "Expected unicode code point escape ('\\u{100}'), but unicode escape ('\\u0100') is used.",
                    column: 16,
                },
                {
                    message:
                        "Expected unicode code point escape ('\\u{ff}'), but unicode escape ('\\u00ff') is used.",
                    column: 23,
                },
            ],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u{ff} \u{100} \ud83d\ude00 \u{1f600}/u`,
            output: String.raw`/a \x0a \cM \0 \u00ff \u0100 \ud83d\ude00 \u{1f600}/u`,
            options: ["unicodeEscape"],
            errors: [
                {
                    message:
                        "Expected unicode escape ('\\u00ff'), but unicode code point escape ('\\u{ff}') is used.",
                    column: 16,
                },
                {
                    message:
                        "Expected unicode escape ('\\u0100'), but unicode code point escape ('\\u{100}') is used.",
                    column: 23,
                },
            ],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u0100 \u00ff \ud83d\ude00 \u{1f600}/v`,
            output: String.raw`/a \x0a \cM \0 \u{100} \u{ff} \ud83d\ude00 \u{1f600}/v`,
            options: ["unicodeCodePointEscape"],
            errors: [
                {
                    message:
                        "Expected unicode code point escape ('\\u{100}'), but unicode escape ('\\u0100') is used.",
                    column: 16,
                },
                {
                    message:
                        "Expected unicode code point escape ('\\u{ff}'), but unicode escape ('\\u00ff') is used.",
                    column: 23,
                },
            ],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u{ff} \u{100} \ud83d\ude00 \u{1f600}/v`,
            output: String.raw`/a \x0a \cM \0 \u00ff \u0100 \ud83d\ude00 \u{1f600}/v`,
            options: ["unicodeEscape"],
            errors: [
                {
                    message:
                        "Expected unicode escape ('\\u00ff'), but unicode code point escape ('\\u{ff}') is used.",
                    column: 16,
                },
                {
                    message:
                        "Expected unicode escape ('\\u0100'), but unicode code point escape ('\\u{100}') is used.",
                    column: 23,
                },
            ],
        },
    ],
})
