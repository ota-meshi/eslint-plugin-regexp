import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-d"

const tester = new RuleTester({
    parserOptions: {
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
    ],
    invalid: [
        {
            code: "/[0-9]/",
            output: "/\\d/",
            errors: [
                {
                    message:
                        "Unexpected character class '[0-9]'. Use '\\d' instead.",
                    column: 2,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/[^0-9]/",
            output: "/\\D/",
            errors: [
                {
                    message:
                        "Unexpected character class '[^0-9]'. Use '\\D' instead.",
                    column: 2,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/[^0-9\\w]/",
            output: "/[^\\d\\w]/",
            errors: [
                {
                    message:
                        "Unexpected character class range '0-9'. Use '\\d' instead.",
                    column: 4,
                    endColumn: 7,
                },
            ],
        },
        {
            code: `
            const s = "[0-9]"
            new RegExp(s)
            `,
            output: `
            const s = "\\\\d"
            new RegExp(s)
            `,
            errors: ["Unexpected character class '[0-9]'. Use '\\d' instead."],
        },
        {
            code: `
            const s = "[0-"+"9]"
            new RegExp(s)
            `,
            output: null,
            errors: ["Unexpected character class '[0-9]'. Use '\\d' instead."],
        },
        {
            code: String.raw`/[0-9a-z]/`,
            output: String.raw`/[\da-z]/`,
            options: [{ insideCharacterClass: "d" }],
            errors: [
                "Unexpected character class range '0-9'. Use '\\d' instead.",
            ],
        },
        {
            code: String.raw`/[\da-z]/`,
            output: String.raw`/[0-9a-z]/`,
            options: [{ insideCharacterClass: "range" }],
            errors: ["Unexpected character set '\\d'. Use '0-9' instead."],
        },
        {
            code: "/[0-9]/v",
            output: String.raw`/\d/v`,
            errors: [
                {
                    message:
                        "Unexpected character class '[0-9]'. Use '\\d' instead.",
                    column: 2,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/[[0-9]--[0-7]]/v",
            output: String.raw`/[\d--[0-7]]/v`,
            errors: [
                {
                    message:
                        "Unexpected character class '[0-9]'. Use '\\d' instead.",
                    column: 3,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/[[0-:]--:]/v",
            output: String.raw`/\d/v`,
            errors: [
                {
                    message:
                        "Unexpected character class '[[0-:]--:]'. Use '\\d' instead.",
                    column: 2,
                    endColumn: 12,
                },
            ],
        },
        {
            code: String.raw`/[[\da-z]--0]/v`,
            output: String.raw`/[[0-9a-z]--0]/v`,
            options: [{ insideCharacterClass: "range" }],
            errors: [
                {
                    message:
                        "Unexpected character set '\\d'. Use '0-9' instead.",
                    column: 4,
                    endColumn: 6,
                },
            ],
        },
        {
            code: String.raw`/[[0-9a-z]--0]/v`,
            output: String.raw`/[[\da-z]--0]/v`,
            options: [{ insideCharacterClass: "d" }],
            errors: [
                {
                    message:
                        "Unexpected character class range '0-9'. Use '\\d' instead.",
                    column: 4,
                    endColumn: 7,
                },
            ],
        },
        {
            code: String.raw`/[\q{0|1|2|3|4|5|6|7|8|9}]/v`,
            output: String.raw`/\d/v`,
            errors: [
                {
                    message:
                        "Unexpected character class '[\\q{0|1|2|3|4|5|6|7|8|9}]'. Use '\\d' instead.",
                    column: 2,
                    endColumn: 27,
                },
            ],
        },
    ],
})
