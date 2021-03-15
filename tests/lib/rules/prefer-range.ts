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
        `/[a-c]/`,
        `/[a-b]/`,
        `/[0-9]/`,
        `/[A-Z]/`,
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
            code: `/[0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ]/`,
            options: [{ target: ["😀-😏"] }],
        },
    ],
    invalid: [
        {
            code: `/[abc]/`,
            output: `/[a-c]/`,
            errors: [
                {
                    message:
                        'Unexpected multiple adjacent characters. Use "a-c" instead.',
                    line: 1,
                    column: 3,
                    endLine: 1,
                    endColumn: 6,
                },
            ],
        },
        {
            code: `/[ABC abc]/`,
            output: `/[A-C a-c]/`,
            errors: [
                'Unexpected multiple adjacent characters. Use "A-C" instead.',
                'Unexpected multiple adjacent characters. Use "a-c" instead.',
            ],
        },
        {
            code: `/[abc-f]/`,
            output: `/[a-f]/`,
            errors: [
                {
                    message:
                        'Unexpected multiple adjacent characters. Use "a-f" instead.',
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
                        'Unexpected multiple adjacent characters. Use "a-f" instead.',
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
                        'Unexpected multiple adjacent characters. Use "a-f" instead.',
                    line: 1,
                    column: 3,
                    endColumn: 6,
                },
                {
                    message:
                        'Unexpected multiple adjacent characters. Use "a-f" instead.',
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
                        'Unexpected multiple adjacent characters. Use "a-f" instead.',
                    line: 1,
                    column: 3,
                },
                {
                    message:
                        'Unexpected multiple adjacent characters. Use "a-f" instead.',
                    line: 1,
                    column: 7,
                },
                {
                    message:
                        'Unexpected multiple adjacent characters. Use "h-m" instead.',
                    line: 1,
                    column: 11,
                },
                {
                    message:
                        'Unexpected multiple adjacent characters. Use "h-m" instead.',
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
                        'Unexpected multiple adjacent characters. Use "a-f" instead.',
                    line: 1,
                    column: 3,
                },
                {
                    message:
                        'Unexpected multiple adjacent characters. Use "a-f" instead.',
                    line: 1,
                    column: 7,
                },
                {
                    message:
                        'Unexpected multiple adjacent characters. Use "h-m" instead.',
                    line: 1,
                    column: 11,
                },
                {
                    message:
                        'Unexpected multiple adjacent characters. Use "h-m" instead.',
                    line: 1,
                    column: 15,
                },
            ],
        },
        {
            code: String.raw`/[0-2\d3-4]/`,
            output: String.raw`/[0-4\d]/`,
            errors: [
                'Unexpected multiple adjacent characters. Use "0-4" instead.',
                'Unexpected multiple adjacent characters. Use "0-4" instead.',
            ],
        },
        {
            code: `/[3-4560-2]/`,
            output: `/[0-6]/`,
            errors: [
                'Unexpected multiple adjacent characters. Use "0-6" instead.',
            ],
        },
        {
            code: String.raw`const s = "[0-23-4\\d]"
            new RegExp(s)`,
            output: null,
            errors: [
                'Unexpected multiple adjacent characters. Use "0-4" instead.',
            ],
        },
        {
            code: `/[ !"#$]/`,
            output: `/[ -$]/`,
            options: [{ target: "all" }],
            errors: [
                'Unexpected multiple adjacent characters. Use " -$" instead.',
            ],
        },
        {
            code: `/[abcd ①②③④⑤⑥⑦⑧⑨10⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/`,
            output: `/[a-d ①-⑨10⑪-⑳]/`,
            options: [{ target: ["alphanumeric", "①-⑳"] }],
            errors: [
                'Unexpected multiple adjacent characters. Use "a-d" instead.',
                'Unexpected multiple adjacent characters. Use "①-⑨" instead.',
                'Unexpected multiple adjacent characters. Use "⑪-⑳" instead.',
            ],
        },
        {
            code: `/[😀😁😂😃😄 😆😇😈😉😊]/u`,
            output: `/[😀-😄 😆-😊]/u`,
            options: [{ target: ["alphanumeric", "😀-😏"] }],
            errors: [
                'Unexpected multiple adjacent characters. Use "😀-😄" instead.',
                'Unexpected multiple adjacent characters. Use "😆-😊" instead.',
            ],
        },
    ],
})
