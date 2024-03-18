import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/letter-case"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
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
        String.raw`/[\q{ab}]/iv`,
        {
            code: String.raw`/[\q{ab}]/iv`,
            options: [{ caseInsensitive: "lowercase" }],
        },
        {
            code: String.raw`/[\q{AB}]/iv`,
            options: [{ caseInsensitive: "uppercase" }],
        },
        {
            code: String.raw`/[\q{Ab}]/iv`,
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
        String.raw`/\x0a/`,
        {
            code: String.raw`/\x0a/`,
            options: [{ hexadecimalEscape: "lowercase" }],
        },
        {
            code: String.raw`/\x0A/`,
            options: [{ hexadecimalEscape: "uppercase" }],
        },
        {
            code: String.raw`/\x0a\x0A/`,
            options: [{ hexadecimalEscape: "ignore" }],
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
        `/Regexp/i`,
        {
            code: `/Regexp/i`,
            options: [{ caseInsensitive: "lowercase" }],
        },
        {
            code: `/ReGeXp/i`,
            options: [{ caseInsensitive: "uppercase" }],
        },
        `/[A-Z]/i`,
        String.raw`/[\u0041-Z]/i`,
        String.raw`/[\u004A-Z]/i`,
        String.raw`/[\u004a-Z]/i`,
        String.raw`/\u000A/`,
        {
            code: String.raw`/\u000A/`,
            options: [{ unicodeEscape: "lowercase" }],
        },
        {
            code: String.raw`/\u000a/`,
            options: [{ unicodeEscape: "uppercase" }],
        },
        String.raw`/\u{A}/u`,
        {
            code: String.raw`/\u{A}/u`,
            options: [{ unicodeEscape: "lowercase" }],
        },
        {
            code: String.raw`/\u{a}/u`,
            options: [{ unicodeEscape: "uppercase" }],
        },
        String.raw`/\x0A/`,
        {
            code: String.raw`/\x0A/`,
            options: [{ hexadecimalEscape: "lowercase" }],
        },
        {
            code: String.raw`/\x0a/`,
            options: [{ hexadecimalEscape: "uppercase" }],
        },
        String.raw`/\ca/u`,
        {
            code: String.raw`/\cA/u`,
            options: [{ controlEscape: "lowercase" }],
        },
        {
            code: String.raw`/\ca/u`,
            options: [{ controlEscape: "uppercase" }],
        },
        {
            code: String.raw`const s = "\\u000A";
            new RegExp(s)`,
            options: [{ unicodeEscape: "lowercase" }],
        },
        {
            code: String.raw`const s = "\\u"+"000A";
            new RegExp(s)`,
            options: [{ unicodeEscape: "lowercase" }],
        },
        String.raw`/[\q{Ab}]/iv`,
        {
            code: String.raw`/[\q{Ab}]/iv`,
            options: [{ caseInsensitive: "lowercase" }],
        },
        {
            code: String.raw`/[\q{Ab}]/iv`,
            options: [{ caseInsensitive: "uppercase" }],
        },
    ],
})
