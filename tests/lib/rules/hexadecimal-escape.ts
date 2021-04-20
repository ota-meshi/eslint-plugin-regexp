import { RuleTester } from "eslint"
import rule from "../../../lib/rules/hexadecimal-escape"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("hexadecimal-escape", rule as any, {
    valid: [
        String.raw`/a \x0a \cM \0 \u0100 \u{100}/u`,
        String.raw`/\7/`,
        {
            code: String.raw`/a \x0a \cM \0 \u0100 \u{100}/u`,
            options: ["always"],
        },
        {
            code: String.raw`/\7/`,
            options: ["always"],
        },
        {
            code: String.raw`/a \u000a \u{a} \cM \0 \u0100 \u{100}/u`,
            options: ["never"],
        },
        {
            code: String.raw`/\7/`,
            options: ["never"],
        },
        String.raw`/\cA \cB \cM/`,
    ],
    invalid: [
        {
            code: String.raw`/\u000a \u{00000a}/u`,
            output: String.raw`/\x0a \x0a/u`,
            errors: [
                {
                    message:
                        "Expected hexadecimal escape ('\\x0a'), but unicode escape ('\\u000a') is used.",
                    column: 2,
                },
                {
                    message:
                        "Expected hexadecimal escape ('\\x0a'), but unicode code point escape ('\\u{00000a}') is used.",
                    column: 9,
                },
            ],
        },
        {
            code: String.raw`/\u000a \u{00000a}/u`,
            output: String.raw`/\x0a \x0a/u`,
            options: ["always"],
            errors: [
                {
                    message:
                        "Expected hexadecimal escape ('\\x0a'), but unicode escape ('\\u000a') is used.",
                    column: 2,
                },
                {
                    message:
                        "Expected hexadecimal escape ('\\x0a'), but unicode code point escape ('\\u{00000a}') is used.",
                    column: 9,
                },
            ],
        },
        {
            code: String.raw`/\x0f \xff/u`,
            output: String.raw`/\u000f \u00ff/u`,
            options: ["never"],
            errors: [
                {
                    message: "Unexpected hexadecimal escape ('\\x0f').",
                    column: 2,
                },
                {
                    message: "Unexpected hexadecimal escape ('\\xff').",
                    column: 7,
                },
            ],
        },
        {
            code: String.raw`/\x0a \x0b \x41/u`,
            output: String.raw`/\n \u000b A/u`,
            options: ["never"],
            errors: [
                {
                    message: "Unexpected hexadecimal escape ('\\x0a').",
                    column: 2,
                },
                {
                    message: "Unexpected hexadecimal escape ('\\x0b').",
                    column: 7,
                },
                {
                    message: "Unexpected hexadecimal escape ('\\x41').",
                    column: 12,
                },
            ],
        },
    ],
})
