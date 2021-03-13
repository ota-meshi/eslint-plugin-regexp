import { RuleTester } from "eslint"
import rule from "../../../lib/rules/order-in-character-class"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("order-in-character-class", rule as any, {
    valid: [
        `/[abcd]/`,
        String.raw`/[aa]/u`,
        String.raw`/[\d\d]/u`,
        String.raw`/[\s\S]/u`,
        String.raw`/[\S\s]/u`,
        String.raw`/[\d\D]/u`,
        String.raw`/[\D\d]/u`,
        String.raw`/[\w\W]/u`,
        String.raw`/[\W\w]/u`,
        String.raw`/[\p{Script=Hiragana}\p{Script=Hiragana}]/u`,
        String.raw`/[\p{Script=Hiragana}\P{Script=Hiragana}]/u`,
        String.raw`/[\P{Script=Hiragana}\p{Script=Hiragana}]/u`,
        String.raw`/[\w\p{ASCII}]/u`,
        {
            code: String.raw`/[\w\p{ASCII}]/u`,
            options: [{ order: [] }],
        },
        String.raw`/[\p{ASCII}\p{Script=Hiragana}]/u`,
        String.raw`/[\w\d]/u`,
        {
            code: String.raw`/[\w\d]/u`,
            options: [{ order: [] }],
        },
        String.raw`/[\p{ASCII}a]/u`,
        {
            code: String.raw`/[\p{ASCII}a]/u`,
            options: [{ order: [] }],
        },
    ],
    invalid: [
        {
            code: `/[acdb]/`,
            output: `/[abcd]/`,
            errors: [
                {
                    message:
                        "Expected character class elements to be in ascending order. 'b' should be before 'c'.",
                    line: 1,
                    column: 6,
                    endLine: 1,
                    endColumn: 7,
                },
            ],
        },
        {
            code: `/[b-da]/`,
            output: `/[ab-d]/`,
            errors: [
                {
                    message:
                        "Expected character class elements to be in ascending order. 'a' should be before 'b-d'.",
                    line: 1,
                    column: 6,
                    endLine: 1,
                    endColumn: 7,
                },
            ],
        },
        {
            code: `/[b-da]/`,
            output: `/[ab-d]/`,
            options: [{ order: [] }],
            errors: [
                {
                    message:
                        "Expected character class elements to be in ascending order. 'a' should be before 'b-d'.",
                    line: 1,
                    column: 6,
                    endLine: 1,
                    endColumn: 7,
                },
            ],
        },
        {
            code: `/[da-c]/`,
            output: `/[a-cd]/`,
            errors: [
                {
                    message:
                        "Expected character class elements to be in ascending order. 'a-c' should be before 'd'.",
                    line: 1,
                    column: 4,
                    endLine: 1,
                    endColumn: 7,
                },
            ],
        },
        {
            code: `/[da-c]/`,
            output: `/[a-cd]/`,
            options: [{ order: [] }],
            errors: [
                {
                    message:
                        "Expected character class elements to be in ascending order. 'a-c' should be before 'd'.",
                    line: 1,
                    column: 4,
                    endLine: 1,
                    endColumn: 7,
                },
            ],
        },
        {
            code: String.raw`/[abcd\d]/`,
            output: String.raw`/[\dabcd]/`,
            errors: [
                "Expected character class elements to be in ascending order. '\\d' should be before 'a'.",
            ],
        },
        {
            code: String.raw`/[\s\d\w]/`,
            output: String.raw`/[\s\w\d]/`,
            errors: [
                "Expected character class elements to be in ascending order. '\\w' should be before '\\d'.",
            ],
        },
        {
            code: String.raw`/[\s\d\w]/`,
            output: String.raw`/[\s\w\d]/`,
            options: [{ order: [] }],
            errors: [
                "Expected character class elements to be in ascending order. '\\w' should be before '\\d'.",
            ],
        },
        {
            code: String.raw`/[\p{ASCII}\w]/u`,
            output: String.raw`/[\w\p{ASCII}]/u`,
            errors: [
                "Expected character class elements to be in ascending order. '\\w' should be before '\\p{ASCII}'.",
            ],
        },
        {
            code: String.raw`/[\p{ASCII}\w]/u`,
            output: String.raw`/[\w\p{ASCII}]/u`,
            options: [{ order: [] }],
            errors: [
                "Expected character class elements to be in ascending order. '\\w' should be before '\\p{ASCII}'.",
            ],
        },
        {
            code: String.raw`/[\p{Script=Hiragana}\p{ASCII}]/u`,
            output: String.raw`/[\p{ASCII}\p{Script=Hiragana}]/u`,
            errors: [
                "Expected character class elements to be in ascending order. '\\p{ASCII}' should be before '\\p{Script=Hiragana}'.",
            ],
        },
        {
            code: String.raw`/[\p{Script=Hiragana}\p{Script=Han}]/u`,
            output: String.raw`/[\p{Script=Han}\p{Script=Hiragana}]/u`,
            errors: [
                `Expected character class elements to be in ascending order. '\\p{Script=Han}' should be before '\\p{Script=Hiragana}'.`,
            ],
        },
        {
            code: String.raw`/[\d\w]/u`,
            output: String.raw`/[\w\d]/u`,
            options: [{ order: [] }],
            errors: [
                "Expected character class elements to be in ascending order. '\\w' should be before '\\d'.",
            ],
        },
        {
            code: String.raw`/[\da-b-]/u`,
            output: String.raw`/[\d\-a-b]/u`,
            errors: [
                "Expected character class elements to be in ascending order. '-' should be before 'a-b'.",
            ],
        },
        {
            code: String.raw`/[a-b-]/u`,
            output: String.raw`/[-a-b]/u`,
            errors: [
                "Expected character class elements to be in ascending order. '-' should be before 'a-b'.",
            ],
        },
        {
            code: String.raw`/[-$a]/u`,
            output: String.raw`/[$\-a]/u`,
            errors: [
                "Expected character class elements to be in ascending order. '$' should be before '-'.",
            ],
        },
        {
            code: String.raw`/[-_\s]+/gu`,
            output: String.raw`/[\s\-_]+/gu`,
            errors: [
                "Expected character class elements to be in ascending order. '\\s' should be before '-'.",
            ],
        },
        {
            code: String.raw`/[-_-]/u`,
            output: String.raw`/[-\-_]/u`,
            errors: [
                "Expected character class elements to be in ascending order. '-' should be before '_'.",
            ],
        },
        {
            code: String.raw`const s = "[\\d\\w]"
            new RegExp(s, 'u')`,
            output: String.raw`const s = "[\\w\\d]"
            new RegExp(s, 'u')`,
            options: [{ order: [] }],
            errors: [
                "Expected character class elements to be in ascending order. '\\w' should be before '\\d'.",
            ],
        },
        {
            code: String.raw`const s = "[\\d"+"\\w]"
            new RegExp(s, 'u')`,
            output: null,
            options: [{ order: [] }],
            errors: [
                "Expected character class elements to be in ascending order. '\\w' should be before '\\d'.",
            ],
        },
    ],
})
