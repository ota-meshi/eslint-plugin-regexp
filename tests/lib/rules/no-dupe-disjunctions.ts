import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-dupe-disjunctions"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-dupe-disjunctions", rule as any, {
    valid: [
        ...[
            String.raw`/^\s*(eslint-(?:en|dis)able)(?:\s+(\S|\S[\s\S]*\S))?\s*$/u`,
            `/a|b/`,
            `/(a|b)/`,
            `/(?:a|b)/`,
            `/((?:ab|ba)|(?:ba|ac))/`,
            `/(?:js|json)$/`,
            `/(?:js|jso?n?)$/`,
            `/(?:js|json)abc/`,
            `/(?:js|json)?abc/`,
            `/(?:yml|ya?ml)$/`,
            `/(?:yml|ya?ml)/`,
        ].reduce(
            (acc, x) =>
                acc.concat(x, {
                    code: x,
                    options: [{ disallowNeverMatch: true }],
                }),
            [] as (RuleTester.ValidTestCase | string)[],
        ),
        `/(?:(a)|(a))/`,
        `/(?:a|ab)/`,
        `/(?:.|a|b)/`,
        {
            code: `/<("[^"]*"|'[^']*'|[^'">])*>/g`,
            options: [{ disallowNeverMatch: true }],
        },
    ],
    invalid: [
        ...[
            {
                code: `/a|a/`,
                errors: [
                    {
                        message: "The disjunctions are duplicated.",
                        line: 1,
                        column: 4,
                        endLine: 1,
                        endColumn: 5,
                    },
                ],
            },
            {
                code: `/(a|a)/`,
                errors: [
                    {
                        message: "The disjunctions are duplicated.",
                        line: 1,
                        column: 5,
                        endLine: 1,
                        endColumn: 6,
                    },
                ],
            },
            {
                code: `/(?:a|a)/`,
                errors: [
                    {
                        message: "The disjunctions are duplicated.",
                        line: 1,
                        column: 7,
                        endLine: 1,
                        endColumn: 8,
                    },
                ],
            },
            {
                code: `/(?=a|a)/`,
                errors: [
                    {
                        message: "The disjunctions are duplicated.",
                        line: 1,
                        column: 7,
                        endLine: 1,
                        endColumn: 8,
                    },
                ],
            },
            {
                code: `/(?<=a|a)/`,
                errors: [
                    {
                        message: "The disjunctions are duplicated.",
                        line: 1,
                        column: 8,
                        endLine: 1,
                        endColumn: 9,
                    },
                ],
            },
            {
                code: `/(?:[ab]|[ab])/`,
                errors: ["The disjunctions are duplicated."],
            },
            {
                code: `/(?:[ab]|[ba])/`,
                errors: ["The disjunctions are duplicated."],
            },
            {
                code: String.raw`/(?:[\da-z]|[a-z\d])/`,
                errors: ["The disjunctions are duplicated."],
            },
            {
                code: `/((?:ab|ba)|(?:ab|ba))/`,
                errors: ["The disjunctions are duplicated."],
            },
            {
                code: `/((?:ab|ba)|(?:ba|ab))/`,
                errors: ["The disjunctions are duplicated."],
            },
        ].reduce(
            (acc, x) =>
                acc.concat(x, {
                    ...x,
                    options: [{ disallowNeverMatch: true }],
                }),
            [] as RuleTester.InvalidTestCase[],
        ),
        {
            code: `/(?:(a)|(a))/`,
            options: [{ disallowNeverMatch: true }],
            errors: ["The disjunctions are duplicated."],
        },
        {
            code: `/(?:a|ab)/`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
            ],
        },
        {
            code: `/(?:.|a|b)/`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    line: 1,
                    column: 7,
                    endLine: 1,
                    endColumn: 8,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    line: 1,
                    column: 9,
                    endLine: 1,
                    endColumn: 10,
                },
            ],
        },
        {
            code: `/.|abc/`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
            ],
        },
        {
            code: `/a|abc/`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
            ],
        },
        {
            code: String.raw`/\d|abc|123|_|[A-Z]|\$| /`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 9,
                },
            ],
        },
        {
            code: String.raw`/\D|abc|123|_|[A-Z]|\$| /`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 5,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 13,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 15,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 21,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 24,
                },
            ],
        },
        {
            code: String.raw`/\w|abc|123|_|[A-Z]|\$| /`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 5,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 9,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 13,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 15,
                },
            ],
        },
        {
            code: String.raw`/\W|abc|123|_|[A-Z]|\$| /`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 21,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 24,
                },
            ],
        },
        {
            code: String.raw`/\s|abc|123|_|[A-Z]|\$| /`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 24,
                },
            ],
        },
        {
            code: String.raw`/\S|abc|123|_|[A-Z]|\$| /`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 5,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 9,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 13,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 15,
                },
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 21,
                },
            ],
        },
        {
            code: String.raw`/[^\S]|abc|123|_|[A-Z]|\$| /`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                {
                    message:
                        "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
                    column: 27,
                },
            ],
        },
        {
            code: String.raw`/[^\r]|./`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
            ],
        },
        {
            code: `/(?:ya?ml|yml)$/`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
            ],
        },
        {
            code: `/(?:ya?ml|yml)/`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
            ],
        },
        {
            code: String.raw`/(?:\p{Lu}\p{L}*|[A-Z]\w*)/u`,
            options: [{ disallowNeverMatch: true }],
            errors: [
                "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
            ],
        },
    ],
})
