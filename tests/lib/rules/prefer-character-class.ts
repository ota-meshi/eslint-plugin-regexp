import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-character-class"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-character-class", rule as any, {
    valid: [
        `/regexp/`,
        `/[regexp]/`,
        `/reg|exp/`,
        String.raw`/a|b|c|\d|(d)/`,
        String.raw`/a|.|c|\d|c|[-d-f]/`,
    ],
    invalid: [
        {
            code: String.raw`/a|b|c|\d/`,
            output: String.raw`/[abc\d]/`,
            errors: [
                {
                    message:
                        'Unexpected the disjunction of single element alternatives. Use character class "[...]" instead.',
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 10,
                },
            ],
        },
        {
            code: String.raw`/(a|b|c|\d)/`,
            output: String.raw`/([abc\d])/`,
            errors: [
                {
                    message:
                        'Unexpected the disjunction of single element alternatives. Use character class "[...]" instead.',
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 12,
                },
            ],
        },
        {
            code: String.raw`/(?:a|b|c|\d)/`,
            output: String.raw`/(?:[abc\d])/`,
            errors: [
                {
                    message:
                        'Unexpected the disjunction of single element alternatives. Use character class "[...]" instead.',
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 14,
                },
            ],
        },
        {
            code: String.raw`/(?=a|b|c|\d)/`,
            output: String.raw`/(?=[abc\d])/`,
            errors: [
                {
                    message:
                        'Unexpected the disjunction of single element alternatives. Use character class "[...]" instead.',
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 14,
                },
            ],
        },
        {
            code: String.raw`/(?<=a|b|c|\d)/`,
            output: String.raw`/(?<=[abc\d])/`,
            errors: [
                {
                    message:
                        'Unexpected the disjunction of single element alternatives. Use character class "[...]" instead.',
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 15,
                },
            ],
        },
        {
            code: String.raw`/a|b|c|\d|[d-f]/`,
            output: String.raw`/[abc\dd-f]/`,
            errors: [
                'Unexpected the disjunction of single element alternatives. Use character class "[...]" instead.',
            ],
        },
        {
            code: String.raw`/a|-|c|\d|c|[-d-f]/`,
            output: String.raw`/[a\-c\dc\-d-f]/`,
            errors: [
                'Unexpected the disjunction of single element alternatives. Use character class "[...]" instead.',
            ],
        },
        {
            code: String.raw`/a|[.]|c|\d|c|[-d-f]/`,
            output: String.raw`/[a.c\dc\-d-f]/`,
            errors: [
                'Unexpected the disjunction of single element alternatives. Use character class "[...]" instead.',
            ],
        },
        {
            code: String.raw`const s = "a|b|\\d|c"
            new RegExp(s)`,
            output: String.raw`const s = "[ab\\dc]"
            new RegExp(s)`,
            errors: [
                'Unexpected the disjunction of single element alternatives. Use character class "[...]" instead.',
            ],
        },
        {
            code: String.raw`const s = "a|b|"+"c"
            new RegExp(s)`,
            output: null,
            errors: [
                'Unexpected the disjunction of single element alternatives. Use character class "[...]" instead.',
            ],
        },
    ],
})
