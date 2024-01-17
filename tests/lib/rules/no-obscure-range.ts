import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-obscure-range"

const tester = new RuleTester({
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
            errors: [
                "Unexpected obscure character range. The characters of 'а-я' (U+0430 - U+044f) are not obvious.",
                "Unexpected obscure character range. The characters of 'А-Я' (U+0410 - U+042f) are not obvious.",
            ],
            settings: {
                regexp: {
                    allowedCharacterRanges: ["alphanumeric", "а-я", "А-Я"],
                },
            },
        },

        {
            code: "/[\\1-\\x13]/",
            errors: [
                {
                    message:
                        "Unexpected obscure character range. The characters of '\\1-\\x13' (U+0001 - U+0013) are not obvious.",
                },
            ],
        },
        {
            code: "/[\\x20-\\113]/",
            errors: [
                {
                    message:
                        "Unexpected obscure character range. The characters of '\\x20-\\113' (U+0020 - U+004b) are not obvious.",
                },
            ],
        },

        {
            code: "/[\\n-\\r]/",
            errors: [
                {
                    message:
                        "Unexpected obscure character range. The characters of '\\n-\\r' (U+000a - U+000d) are not obvious.",
                },
            ],
        },

        {
            code: "/[\\cA-Z]/",
            errors: [
                {
                    message:
                        "Unexpected obscure character range. The characters of '\\cA-Z' (U+0001 - U+005a) are not obvious.",
                },
            ],
        },

        {
            code: "/[A-z]/",
            errors: [
                {
                    message:
                        "Unexpected obscure character range. The characters of 'A-z' (U+0041 - U+007a) are not obvious.",
                },
            ],
        },
        {
            code: "/[0-A]/",
            errors: [
                {
                    message:
                        "Unexpected obscure character range. The characters of '0-A' (U+0030 - U+0041) are not obvious.",
                },
            ],
        },
        {
            code: "/[Z-a]/",
            errors: [
                {
                    message:
                        "Unexpected obscure character range. The characters of 'Z-a' (U+005a - U+0061) are not obvious.",
                },
            ],
        },
        {
            code: "/[A-\\x43]/",
            errors: [
                {
                    message:
                        "Unexpected obscure character range. The characters of 'A-\\x43' (U+0041 - U+0043) are not obvious.",
                },
            ],
        },

        {
            code: "/[*+-/]/",
            errors: [
                {
                    message:
                        "Unexpected obscure character range. The characters of '+-/' (U+002b - U+002f) are not obvious.",
                },
            ],
        },
        {
            code: String.raw`/[[ -\/]--+]/v`,
            errors: [
                {
                    message:
                        "Unexpected obscure character range. The characters of ' -\\/' (U+0020 - U+002f) are not obvious.",
                    line: 1,
                    column: 4,
                },
            ],
        },
    ],
})
