import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/hexadecimal-escape"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
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
        {
            code: String.raw`/[\q{\x0a}]/v`,
            options: ["always"],
        },
        {
            code: String.raw`/[\q{\u000a}]/v`,
            options: ["never"],
        },
    ],
    invalid: [
        String.raw`/\u000a \u{00000a}/u`,
        {
            code: String.raw`/\u000a \u{00000a}/u`,
            options: ["always"],
        },
        {
            code: String.raw`/\x0f \xff/u`,
            options: ["never"],
        },
        {
            code: String.raw`/\x0a \x0b \x41/u`,
            options: ["never"],
        },
        {
            code: String.raw`/[\q{\u000a \u{00000a}}]/v`,
            options: ["always"],
        },
        {
            code: String.raw`/[\q{\x0f \xff}]/v`,
            options: ["never"],
        },
    ],
})
