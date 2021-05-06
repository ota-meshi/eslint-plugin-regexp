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
        `/<("[^"]*"|'[^']*'|[^'">])*>/g`,
        String.raw`/b+(?:\w+|[+-]?\d+)/`,
        String.raw`/A+_|A*_/`,
        String.raw`/(?:A+|A*)_/`,
        String.raw`/\d*\.\d+_|\d+\.\d*_/`,
        String.raw`/\d*\.\d+|\d+\.\d*/`,
        String.raw`/(?:\d*\.\d+|\d+\.\d*)_/`,
    ],
    invalid: [
        {
            code: `/a|a/`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
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
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
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
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    line: 1,
                    column: 7,
                    endLine: 1,
                    endColumn: 8,
                },
            ],
        },
        {
            code: `/(?=[a-c])|(?=a)/`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '(?=[a-c])' and can be removed.",
                    column: 12,
                    endColumn: 17,
                },
            ],
        },
        {
            code: `/(?=a|a)/`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
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
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    line: 1,
                    column: 8,
                    endLine: 1,
                    endColumn: 9,
                },
            ],
        },
        {
            code: `/(?:[ab]|[ab])/`,
            errors: [
                "Unexpected duplicate alternative. This alternative can be removed.",
            ],
        },
        {
            code: `/(?:[ab]|[ba])/`,
            errors: [
                "Unexpected duplicate alternative. This alternative can be removed.",
            ],
        },
        {
            code: String.raw`/(?:[\da-z]|[a-z\d])/`,
            errors: [
                "Unexpected duplicate alternative. This alternative can be removed.",
            ],
        },
        {
            code: `/((?:ab|ba)|(?:ab|ba))/`,
            errors: [
                "Unexpected duplicate alternative. This alternative can be removed.",
            ],
        },
        {
            code: `/((?:ab|ba)|(?:ba|ab))/`,
            errors: [
                "Unexpected duplicate alternative. This alternative can be removed.",
            ],
        },
        {
            code: `/(?:(a)|(a))/`,
            errors: [
                "Unexpected duplicate alternative. This alternative can be removed. Careful! This alternative contains capturing groups which might be difficult to remove.",
            ],
        },
        {
            code: `/(?:a|ab)/`,
            errors: [
                "Unexpected useless alternative. This alternative is already covered by 'a' and can be removed.",
            ],
        },
        {
            code: `/(?:.|a|b)/`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '.' and can be removed.",
                    line: 1,
                    column: 7,
                    endLine: 1,
                    endColumn: 8,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '.' and can be removed.",
                    line: 1,
                    column: 9,
                    endLine: 1,
                    endColumn: 10,
                },
            ],
        },
        {
            code: `/.|abc/`,
            errors: [
                "Unexpected useless alternative. This alternative is already covered by '.' and can be removed.",
            ],
        },
        {
            code: `/a|abc/`,
            errors: [
                "Unexpected useless alternative. This alternative is already covered by 'a' and can be removed.",
            ],
        },
        {
            code: String.raw`/\w|abc|123|_|[A-Z]|\$| /`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '\\w' and can be removed.",
                    column: 5,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '\\w' and can be removed.",
                    column: 9,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\w' and can be removed.",
                    column: 13,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\w' and can be removed.",
                    column: 15,
                },
            ],
        },
        {
            code: String.raw`/\W|abc|123|_|[A-Z]|\$| /`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\W' and can be removed.",
                    column: 21,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\W' and can be removed.",
                    column: 24,
                },
            ],
        },
        {
            code: String.raw`/\s|abc|123|_|[A-Z]|\$| /`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\s' and can be removed.",
                    column: 24,
                },
            ],
        },
        {
            code: String.raw`/\S|abc|123|_|[A-Z]|\$| /`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '\\S' and can be removed.",
                    column: 5,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '\\S' and can be removed.",
                    column: 9,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\S' and can be removed.",
                    column: 13,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\S' and can be removed.",
                    column: 15,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\S' and can be removed.",
                    column: 21,
                },
            ],
        },
        {
            code: String.raw`/[^\S]|abc|123|_|[A-Z]|\$| /`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '[^\\S]' and can be removed.",
                    column: 27,
                },
            ],
        },
        {
            code: String.raw`/[^\r]|./`,
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of '[^\\r]' and can be removed.",
            ],
        },
        {
            code: String.raw`/\s|\S|./`,
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of '\\s|\\S' and can be removed.",
            ],
        },
        {
            code: `/(?:ya?ml|yml)$/`,
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of 'ya?ml' and can be removed.",
            ],
        },
        {
            code: `/(?:ya?ml|yml)/`,
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of 'ya?ml' and can be removed.",
            ],
        },
        {
            code: String.raw`/(?:\p{Lu}\p{L}*|[A-Z]\w*):/u`,
            options: [{ report: "all" }],
            errors: [
                "Unexpected overlap. This alternative overlaps with '\\p{Lu}\\p{L}*'. The overlap is '[A-Z][A-Za-z]*'.",
            ],
        },
        {
            code: String.raw`/(?:\p{Lu}\p{L}*|[A-Z]\w*)/u`,
            errors: [
                "Unexpected useless alternative. This alternative is already covered by '\\p{Lu}\\p{L}*' and can be removed.",
            ],
        },
        {
            code: String(/b+(?:\w+|[+-]?\d+)/),
            options: [{ report: "all" }],
            errors: [
                "Unexpected overlap. This alternative overlaps with '\\w+'. The overlap is '\\d+'.",
            ],
        },
        {
            code: String(/FOO|foo(?:bar)?/i),
            errors: [
                "Unexpected useless alternative. This alternative is already covered by 'FOO' and can be removed.",
            ],
        },
        {
            code: String(/foo(?:bar)?|foo/),
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of 'foo(?:bar)?' and can be removed.",
            ],
        },
        {
            code: String(/(?=[\t ]+[\S]{1,}|[\t ]+['"][\S]|[\t ]+$|$)/),
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of '[\\t ]+[\\S]{1,}' and can be removed.",
            ],
        },
        {
            code: String(/\w+(?:\s+(?:\S+|"[^"]*"))*/),
            errors: [
                `Unexpected overlap. This alternative overlaps with '\\S+'. The overlap is '"[^\\s"]*"'. This ambiguity is likely to cause exponential backtracking.`,
            ],
        },
        {
            code: String(/\b(?:\d|foo|\w+)\b/),
            options: [{ report: "interesting" }],
            errors: [
                "Unexpected superset. This alternative is a superset of '\\d|foo'. It might be possible to remove the other alternative(s).",
            ],
        },
        {
            code: String(/\d|[a-z]|_|\w/i),
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of '\\d|[a-z]|_' and can be removed.",
            ],
        },
    ],
})
