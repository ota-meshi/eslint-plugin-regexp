import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-range"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-range", rule as any, {
    valid: [
        `/[a]/`,
        `/[ab]/`,
        `/[abc]/`,
        `/[a-b]/`,
        `/[a-c]/`,
        `/[a-d]/`,
        `/[0-9]/`,
        `/[A-Z]/`,
        `/[a-zA-ZZ-a]/`,
        `/[ !"#$]/`,
        {
            code: `/[ !"#$]/`,
            options: [{ target: "alphanumeric" }],
        },
        {
            code: `/[ !"#$]/`,
            options: [{ target: ["alphanumeric"] }],
        },
        {
            code: `/[ !"#$]/`,
            options: [{ target: ["alphanumeric", "①-⑳"] }],
        },
        `/[ -$]/`,
        {
            code: `/[ -$]/`,
            options: [{ target: "all" }],
        },
        {
            code: `/[ -$]/`,
            options: [{ target: ["all"] }],
        },
        {
            code: `/[ -$]/`,
            settings: { regexp: { allowedCharacterRanges: "all" } },
        },
        {
            code: `/[ -$]/`,
            settings: { regexp: { allowedCharacterRanges: ["all"] } },
        },
        {
            code: `/[0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ]/`,
            options: [{ target: ["😀-😏"] }],
        },
        {
            // issue #218
            code: `/[а-яА-Я][А-Яа-я]/`,
            options: [{ target: ["alphanumeric", "а-я", "А-Я"] }],
        },
    ],
    invalid: [
        {
            code: `/[abcd]/`,
            output: `/[a-d]/`,
            errors: [
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'a-d' instead.",
                    line: 1,
                    column: 3,
                    endLine: 1,
                    endColumn: 7,
                },
            ],
        },
        {
            code: `/[ABCD abcd]/`,
            output: `/[A-D a-d]/`,
            errors: [
                "Unexpected multiple adjacent characters. Use 'A-D' instead.",
                "Unexpected multiple adjacent characters. Use 'a-d' instead.",
            ],
        },
        {
            code: `/[abc-f]/`,
            output: `/[a-f]/`,
            errors: [
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'a-f' instead.",
                    line: 1,
                    column: 3,
                    endLine: 1,
                    endColumn: 8,
                },
            ],
        },
        {
            code: `/[a-cd-f]/`,
            output: `/[a-f]/`,
            errors: [
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'a-f' instead.",
                    line: 1,
                    column: 3,
                    endLine: 1,
                    endColumn: 9,
                },
            ],
        },
        {
            code: `/[d-fa-c]/`,
            output: `/[a-f]/`,
            errors: [
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'a-f' instead.",
                    line: 1,
                    column: 3,
                    endLine: 1,
                    endColumn: 9,
                },
            ],
        },
        {
            code: `/[abc_d-f]/`,
            output: `/[a-f_]/`,
            errors: [
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'a-f' instead.",
                    line: 1,
                    column: 3,
                    endColumn: 6,
                },
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'a-f' instead.",
                    line: 1,
                    column: 7,
                    endColumn: 10,
                },
            ],
        },
        {
            code: `/[abc_d-f_h-j_k-m]/`,
            output: `/[a-f__h-m_]/`,
            errors: [
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'a-f' instead.",
                    line: 1,
                    column: 3,
                },
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'a-f' instead.",
                    line: 1,
                    column: 7,
                },
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'h-m' instead.",
                    line: 1,
                    column: 11,
                },
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'h-m' instead.",
                    line: 1,
                    column: 15,
                },
            ],
        },
        {
            code: `/[a-d_d-f_h-k_j-m]/`,
            output: `/[a-f__h-m_]/`,
            errors: [
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'a-f' instead.",
                    line: 1,
                    column: 3,
                },
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'a-f' instead.",
                    line: 1,
                    column: 7,
                },
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'h-m' instead.",
                    line: 1,
                    column: 11,
                },
                {
                    message:
                        "Unexpected multiple adjacent characters. Use 'h-m' instead.",
                    line: 1,
                    column: 15,
                },
            ],
        },
        {
            code: String.raw`/[0-2\d3-4]/`,
            output: String.raw`/[0-4\d]/`,
            errors: [
                "Unexpected multiple adjacent characters. Use '0-4' instead.",
                "Unexpected multiple adjacent characters. Use '0-4' instead.",
            ],
        },
        {
            code: `/[3-4560-2]/`,
            output: `/[0-6]/`,
            errors: [
                "Unexpected multiple adjacent characters. Use '0-6' instead.",
            ],
        },
        {
            code: String.raw`const s = "[0-23-4\\d]"
            new RegExp(s)`,
            output: String.raw`const s = "[0-4\\d]"
            new RegExp(s)`,
            errors: [
                "Unexpected multiple adjacent characters. Use '0-4' instead.",
            ],
        },
        {
            code: String.raw`const s = "[0-23" + "-4\\d]"
            new RegExp(s)`,
            output: null,
            errors: [
                "Unexpected multiple adjacent characters. Use '0-4' instead.",
            ],
        },
        {
            code: `/[ !"#$]/`,
            output: `/[ -$]/`,
            options: [{ target: "all" }],
            errors: [
                "Unexpected multiple adjacent characters. Use ' -$' instead.",
            ],
        },
        {
            code: `/[abcd ①②③④⑤⑥⑦⑧⑨10⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/`,
            output: `/[a-d ①-⑨10⑪-⑳]/`,
            options: [{ target: ["alphanumeric", "①-⑳"] }],
            errors: [
                "Unexpected multiple adjacent characters. Use 'a-d' instead.",
                "Unexpected multiple adjacent characters. Use '①-⑨' instead.",
                "Unexpected multiple adjacent characters. Use '⑪-⑳' instead.",
            ],
        },
        {
            code: `/[😀😁😂😃😄 😆😇😈😉😊]/u`,
            output: `/[😀-😄 😆-😊]/u`,
            options: [{ target: ["alphanumeric", "😀-😏"] }],
            errors: [
                "Unexpected multiple adjacent characters. Use '😀-😄' instead.",
                "Unexpected multiple adjacent characters. Use '😆-😊' instead.",
            ],
        },
        {
            code: `/[😀😁😂😃😄 😆😇😈😉😊]/u`,
            output: `/[😀-😄 😆-😊]/u`,
            errors: [
                "Unexpected multiple adjacent characters. Use '😀-😄' instead.",
                "Unexpected multiple adjacent characters. Use '😆-😊' instead.",
            ],
            settings: {
                regexp: { allowedCharacterRanges: ["alphanumeric", "😀-😏"] },
            },
        },
    ],
})
