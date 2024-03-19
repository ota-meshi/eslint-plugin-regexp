import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-d"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-d", rule as any, {
    valid: [
        String.raw`/\d/`,
        String.raw`/[1-9]/`,
        {
            code: String.raw`/[0-9a-z]/`,
            options: [{ insideCharacterClass: "ignore" }],
        },
        {
            code: String.raw`/[\da-z]/`,
            options: [{ insideCharacterClass: "ignore" }],
        },
        {
            code: String.raw`/[0-9a-z]/`,
            options: [{ insideCharacterClass: "range" }],
        },
        {
            code: String.raw`/[\da-z]/`,
            options: [{ insideCharacterClass: "d" }],
        },
        String.raw`/\d/v`,
        {
            code: String.raw`/[\d--0]/v`,
            options: [{ insideCharacterClass: "range" }],
        },
        String.raw`/[\q{0|1|2|3|4|5|6|7|8}]/v`,
        String.raw`/[\q{0|1|2|3|4|5|6|7|8|9|a}]/v`,
        String.raw`/[\q{0|1|2|3|4|5|6|7|8|9|abc}]/v`,
    ],
    invalid: [
        "/[0-9]/",
        "/[^0-9]/",
        "/[^0-9\\w]/",
        `
            const s = "[0-9]"
            new RegExp(s)
            `,
        `
            const s = "[0-"+"9]"
            new RegExp(s)
            `,
        {
            code: String.raw`/[0-9a-z]/`,
            options: [{ insideCharacterClass: "d" }],
        },
        {
            code: String.raw`/[\da-z]/`,
            options: [{ insideCharacterClass: "range" }],
        },
        "/[0-9]/v",
        "/[[0-9]--[0-7]]/v",
        "/[[0-:]--:]/v",
        {
            code: String.raw`/[[\da-z]--0]/v`,
            options: [{ insideCharacterClass: "range" }],
        },
        {
            code: String.raw`/[[0-9a-z]--0]/v`,
            options: [{ insideCharacterClass: "d" }],
        },
        String.raw`/[\q{0|1|2|3|4|5|6|7|8|9}]/v`,
    ],
})
