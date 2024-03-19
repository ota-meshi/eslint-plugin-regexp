import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-obscure-range"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-obscure-range", rule as any, {
    valid: [
        "/[\\d\\0-\\x1f\\cA-\\cZ\\2-\\5\\012-\\123\\x10-\\uffff a-z a-f]/",
        {
            code: "/[а-я А-Я]/",
            options: [{ allowed: ["alphanumeric", "а-я", "А-Я"] }],
        },
        {
            code: "/[а-я А-Я]/",
            settings: {
                regexp: {
                    allowedCharacterRanges: ["alphanumeric", "а-я", "А-Я"],
                },
            },
        },
        "/[[0-9]--[6-8]]/v",
    ],
    invalid: [
        {
            // rule options override settings
            code: "/[а-я А-Я]/",
            options: [{ allowed: "alphanumeric" }],
            settings: {
                regexp: {
                    allowedCharacterRanges: ["alphanumeric", "а-я", "А-Я"],
                },
            },
        },

        "/[\\1-\\x13]/",
        "/[\\x20-\\113]/",

        "/[\\n-\\r]/",

        "/[\\cA-Z]/",

        "/[A-z]/",
        "/[0-A]/",
        "/[Z-a]/",
        "/[A-\\x43]/",

        "/[*+-/]/",
        String.raw`/[[ -\/]--+]/v`,
    ],
})
