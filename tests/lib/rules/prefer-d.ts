import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-d"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
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
    ],
})
