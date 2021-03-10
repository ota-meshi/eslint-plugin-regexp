import { RuleTester } from "eslint"
import rule from "../../../lib/rules/letter-case"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("letter-case", rule as any, {
    valid: [
        `/regexp/i`,
        {
            code: `/regexp/i`,
            options: [{ caseInsensitive: "lowercase" }],
        },
        {
            code: `/REGEXP/i`,
            options: [{ caseInsensitive: "uppercase" }],
        },
        {
            code: `/Regexp/i`,
            options: [{ caseInsensitive: "ignore" }],
        },
        `/Regexp/`,
        {
            code: `/Regexp/`,
            options: [{ caseInsensitive: "lowercase" }],
        },
        {
            code: `/Regexp/`,
            options: [{ caseInsensitive: "uppercase" }],
        },
        {
            code: `/Regexp/`,
            options: [{ caseInsensitive: "ignore" }],
        },
        `/[A-z]/i`,
        {
            code: `/[A-z]/i`,
            options: [{ caseInsensitive: "lowercase" }],
        },
        {
            code: `/[A-z]/i`,
            options: [{ caseInsensitive: "uppercase" }],
        },
        {
            code: `/[A-z]/i`,
            options: [{ caseInsensitive: "ignore" }],
        },
        String.raw`/\u000a/`,
        {
            code: String.raw`/\u000a/`,
            options: [{ unicodeEscape: "lowercase" }],
        },
        {
            code: String.raw`/\u000A/`,
            options: [{ unicodeEscape: "uppercase" }],
        },
        {
            code: String.raw`/\u000a\u000A/`,
            options: [{ unicodeEscape: "ignore" }],
        },
        String.raw`/\u{a}/u`,
        {
            code: String.raw`/\u{a}/u`,
            options: [{ unicodeEscape: "lowercase" }],
        },
        {
            code: String.raw`/\u{A}/u`,
            options: [{ unicodeEscape: "uppercase" }],
        },
        {
            code: String.raw`/\u{a}\u{A}/u`,
            options: [{ unicodeEscape: "ignore" }],
        },
        String.raw`/\cA/u`,
        {
            code: String.raw`/\ca/u`,
            options: [{ controlEscape: "lowercase" }],
        },
        {
            code: String.raw`/\cA/u`,
            options: [{ controlEscape: "uppercase" }],
        },
        {
            code: String.raw`/\cA\ca/u`,
            options: [{ controlEscape: "ignore" }],
        },
        {
            code: String.raw`/[\c_][\c_]/`,
            options: [{ controlEscape: "lowercase" }],
        },
        {
            code: String.raw`/[\c_][\c_]/`,
            options: [{ controlEscape: "uppercase" }],
        },
    ],
    invalid: [
        {
            code: `/Regexp/i`,
            output: `/regexp/i`,
            errors: [
                {
                    message: "'R' is not in lowercase",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 3,
                },
            ],
        },
        {
            code: `/Regexp/i`,
            output: `/regexp/i`,
            options: [{ caseInsensitive: "lowercase" }],
            errors: [
                {
                    message: "'R' is not in lowercase",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 3,
                },
            ],
        },
        {
            code: `/ReGeXp/i`,
            output: `/REGEXP/i`,
            options: [{ caseInsensitive: "uppercase" }],
            errors: [
                {
                    message: "'e' is not in uppercase",
                    line: 1,
                    column: 3,
                },
                {
                    message: "'e' is not in uppercase",
                    line: 1,
                    column: 5,
                },
                {
                    message: "'p' is not in uppercase",
                    line: 1,
                    column: 7,
                },
            ],
        },
        {
            code: `/[A-Z]/i`,
            output: `/[a-z]/i`,
            errors: ["'A-Z' is not in lowercase"],
        },
        {
            code: String.raw`/\u000A/`,
            output: String.raw`/\u000a/`,
            errors: [String.raw`'\u000A' is not in lowercase`],
        },
        {
            code: String.raw`/\u000A/`,
            output: String.raw`/\u000a/`,
            options: [{ unicodeEscape: "lowercase" }],
            errors: [String.raw`'\u000A' is not in lowercase`],
        },
        {
            code: String.raw`/\u000a/`,
            output: String.raw`/\u000A/`,
            options: [{ unicodeEscape: "uppercase" }],
            errors: [String.raw`'\u000a' is not in uppercase`],
        },
        {
            code: String.raw`/\u{A}/u`,
            output: String.raw`/\u{a}/u`,
            errors: [String.raw`'\u{A}' is not in lowercase`],
        },
        {
            code: String.raw`/\u{A}/u`,
            output: String.raw`/\u{a}/u`,
            options: [{ unicodeEscape: "lowercase" }],
            errors: [String.raw`'\u{A}' is not in lowercase`],
        },
        {
            code: String.raw`/\u{a}/u`,
            output: String.raw`/\u{A}/u`,
            options: [{ unicodeEscape: "uppercase" }],
            errors: [String.raw`'\u{a}' is not in uppercase`],
        },
        {
            code: String.raw`/\ca/u`,
            output: String.raw`/\cA/u`,
            errors: [String.raw`'\ca' is not in uppercase`],
        },
        {
            code: String.raw`/\cA/u`,
            output: String.raw`/\ca/u`,
            options: [{ controlEscape: "lowercase" }],
            errors: [String.raw`'\cA' is not in lowercase`],
        },
        {
            code: String.raw`/\ca/u`,
            output: String.raw`/\cA/u`,
            options: [{ controlEscape: "uppercase" }],
            errors: [String.raw`'\ca' is not in uppercase`],
        },
        {
            code: String.raw`const s = "\\u000A";
            new RegExp(s)`,
            output: null,
            options: [{ unicodeEscape: "lowercase" }],
            errors: [String.raw`'\u000A' is not in lowercase`],
        },
    ],
})
