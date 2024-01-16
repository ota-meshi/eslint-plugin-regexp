import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/prefer-quantifier"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-quantifier", rule as any, {
    valid: [
        `/regexp/`,
        `/\\d_\\d/`,
        `/Google/`,
        `/2000/`,
        `/<!--/`,
        `/\`\`\`/`,
        `/---/`,
        `/a.{1,3}?.{2,4}c/`,
        `/a.{1,3}.{2,4}?c/`,
    ],
    invalid: [
        {
            code: `/\\d\\d/`,
            output: `/\\d{2}/`,
            errors: [
                {
                    message:
                        "Unexpected consecutive same character class escapes. Use '{2}' instead.",
                    line: 1,
                    column: 2,
                    endColumn: 6,
                },
            ],
        },
        {
            code: `/  /`,
            output: `/ {2}/`,
            errors: [
                {
                    message:
                        "Unexpected consecutive same characters. Use '{2}' instead.",
                    line: 1,
                    column: 2,
                    endColumn: 4,
                },
            ],
        },
        {
            code: `/  /v`,
            output: `/ {2}/v`,
            errors: [
                "Unexpected consecutive same characters. Use '{2}' instead.",
            ],
        },
        {
            code: String.raw`/\p{ASCII}\p{ASCII}/u`,
            output: String.raw`/\p{ASCII}{2}/u`,
            errors: [
                "Unexpected consecutive same character class escapes. Use '{2}' instead.",
            ],
        },
        {
            code: String.raw`/\p{Basic_Emoji}\p{Basic_Emoji}/v`,
            output: String.raw`/\p{Basic_Emoji}{2}/v`,
            errors: [
                "Unexpected consecutive same character class escapes. Use '{2}' instead.",
            ],
        },
        {
            code: `/(\\d\\d\\d*)/`,
            output: `/(\\d{2}\\d*)/`,
            errors: [
                {
                    message:
                        "Unexpected consecutive same character class escapes. Use '{2}' instead.",
                    line: 1,
                    column: 3,
                    endColumn: 7,
                },
            ],
        },
        {
            code: String.raw`/\d\d\d\d-\d\d-\d\d/`,
            output: String.raw`/\d{4}-\d{2}-\d{2}/`,
            errors: [
                "Unexpected consecutive same character class escapes. Use '{4}' instead.",
                "Unexpected consecutive same character class escapes. Use '{2}' instead.",
                "Unexpected consecutive same character class escapes. Use '{2}' instead.",
            ],
        },
        {
            code: String.raw`/aaa..\s\s\S\S\p{ASCII}\p{ASCII}/u`,
            output: String.raw`/a{3}..\s{2}\S\S\p{ASCII}{2}/u`,
            errors: [
                "Unexpected consecutive same characters. Use '{3}' instead.",
                "Unexpected consecutive same any characters. Use '{2}' instead.",
                "Unexpected consecutive same character class escapes. Use '{2}' instead.",
                "Unexpected consecutive same character class escapes. Use '{2}' instead.",
                "Unexpected consecutive same character class escapes. Use '{2}' instead.",
            ],
        },
        {
            code: `/aaaa(aaa)/u`,
            output: `/a{4}(a{3})/u`,
            errors: [
                "Unexpected consecutive same characters. Use '{4}' instead.",
                "Unexpected consecutive same characters. Use '{3}' instead.",
            ],
        },
        {
            code: `/(b)?aaaa(b)?/u`,
            output: `/(b)?a{4}(b)?/u`,
            errors: [
                "Unexpected consecutive same characters. Use '{4}' instead.",
            ],
        },
        {
            code: `
            const s = "\\\\d\\\\d"
            new RegExp(s)
            `,
            output: `
            const s = "\\\\d{2}"
            new RegExp(s)
            `,
            errors: [
                "Unexpected consecutive same character class escapes. Use '{2}' instead.",
            ],
        },
        {
            code: `
            const s = "\\\\d"+"\\\\d"
            new RegExp(s)
            `,
            output: null,
            errors: [
                "Unexpected consecutive same character class escapes. Use '{2}' instead.",
            ],
        },
    ],
})
