import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-dupe-characters-character-class"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-dupe-characters-character-class", rule as any, {
    valid: [
        "var re = /[a-zA-Z0-9\\s]/",
        "/[abc]/",
        "/[a][a][a]/",
        "/[0-9\\D]/",
        "/[\\S \\f\\n\\r\\t\\v\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]/",
        "/\\s \\f\\n\\r\\t\\v\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff/",
        "/[\\WA-Za-z0-9_]/",
        "/[\\w \\/-:]/",
        "/[\\w\\p{L}]/u",
        "/\\p{ASCII}abc/u",
        String.raw`/[\u1fff-\u2020\s]/`,
        // error
        "var r = new RegExp('[\\\\wA-Za-z0-9_][invalid');",
    ],
    invalid: [
        {
            code: "var re = /[\\\\(\\\\)]/",
            output: "var re = /[\\\\()]/",
            errors: [
                {
                    message: "Unexpected duplicate '\\\\'.",
                    line: 1,
                    column: 15,
                },
            ],
        },
        {
            code: "var re = /[a-z\\\\s]/",
            output: "var re = /[a-z\\\\]/",
            errors: [
                {
                    message: "'s' is already included in 'a-z'.",
                    line: 1,
                    column: 17,
                },
            ],
        },
        {
            code: "/[aaa]/",
            output: "/[aa]/",
            errors: [
                { message: "Unexpected duplicate 'a'.", column: 4 },
                { message: "Unexpected duplicate 'a'.", column: 5 },
            ],
        },
        {
            code: "/[0-9\\d]/",
            output: "/[\\d]/",
            errors: [
                {
                    message: "'0-9' is already included in '\\d'.",
                    column: 3,
                },
            ],
        },
        {
            code: "/[\\f\\u000C]/",
            output: "/[\\f]/",
            errors: [
                {
                    message:
                        "Unexpected duplicate. '\\u000C' is a duplicate of '\\f'.",
                    column: 5,
                },
            ],
        },
        {
            code:
                "/[\\s \\f\\n\\r\\t\\v\\u00a0\\u1680\\u180e\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]/",
            output: "/[\\s\\f\\r\\v\\u1680\\u180e\\u2028\\u202f\\u3000]/",
            errors: [
                { message: "' ' is already included in '\\s'.", column: 5 },
                { message: "'\\f' is already included in '\\s'.", column: 6 },
                { message: "'\\n' is already included in '\\s'.", column: 8 },
                { message: "'\\r' is already included in '\\s'.", column: 10 },
                { message: "'\\t' is already included in '\\s'.", column: 12 },
                { message: "'\\v' is already included in '\\s'.", column: 14 },
                {
                    message: "'\\u00a0' is already included in '\\s'.",
                    column: 16,
                },
                {
                    message: "'\\u1680' is already included in '\\s'.",
                    column: 22,
                },
                {
                    message: "'\\u2000-\\u200a' is already included in '\\s'.",
                    column: 34,
                },
                {
                    message: "'\\u2028' is already included in '\\s'.",
                    column: 47,
                },
                {
                    message: "'\\u2029' is already included in '\\s'.",
                    column: 53,
                },
                {
                    message: "'\\u202f' is already included in '\\s'.",
                    column: 59,
                },
                {
                    message: "'\\u205f' is already included in '\\s'.",
                    column: 65,
                },
                {
                    message: "'\\u3000' is already included in '\\s'.",
                    column: 71,
                },
                {
                    message: "'\\ufeff' is already included in '\\s'.",
                    column: 77,
                },
            ],
        },
        {
            code: "/[\\t\t \\u0009]/",
            output: "/[\\t ]/",
            errors: [
                {
                    message:
                        "Unexpected duplicate. '\t' is a duplicate of '\\t'.",
                    column: 5,
                },
                {
                    message:
                        "Unexpected duplicate. '\\u0009' is a duplicate of '\\t'.",
                    column: 7,
                },
            ],
        },
        {
            code: "/[\\wA-Z a-z:0-9,_]/",
            output: "/[\\w :,]/",
            errors: [
                {
                    message: "'A-Z' is already included in '\\w'.",
                    column: 5,
                },
                {
                    message: "'a-z' is already included in '\\w'.",
                    column: 9,
                },
                {
                    message: "'0-9' is already included in '\\w'.",
                    column: 13,
                },
                { message: "'_' is already included in '\\w'.", column: 17 },
            ],
        },
        {
            code: "/[!-z_abc-]/",
            output: "/[!-zac]/",
            errors: [
                { message: "'_' is already included in '!-z'.", column: 6 },
                { message: "'a' is already included in '!-z'.", column: 7 },
                { message: "'b' is already included in '!-z'.", column: 8 },
                { message: "'c' is already included in '!-z'.", column: 9 },
                { message: "'-' is already included in '!-z'.", column: 10 },
            ],
        },
        {
            code: "/[\\w_abc-][\\s \\t\\r\\n\\u2000\\u3000]/",
            output: "/[\\wac-][\\s\\t\\n\\u3000]/",
            errors: [
                { message: "'_' is already included in '\\w'.", column: 5 },
                { message: "'a' is already included in '\\w'.", column: 6 },
                { message: "'b' is already included in '\\w'.", column: 7 },
                { message: "'c' is already included in '\\w'.", column: 8 },
                { message: "' ' is already included in '\\s'.", column: 14 },
                { message: "'\\t' is already included in '\\s'.", column: 15 },
                { message: "'\\r' is already included in '\\s'.", column: 17 },
                { message: "'\\n' is already included in '\\s'.", column: 19 },
                {
                    message: "'\\u2000' is already included in '\\s'.",
                    column: 21,
                },
                {
                    message: "'\\u3000' is already included in '\\s'.",
                    column: 27,
                },
            ],
        },
        {
            code: "/[a-z a-z]/",
            output: "/[a-z ]/",
            errors: [{ message: "Unexpected duplicate 'a-z'.", column: 7 }],
        },
        {
            code: "/[a-d e-h_d-e+c-d]/",
            output: "/[a-d e-h_+]/",
            errors: [
                {
                    message:
                        "'d-e' is already included by a combination of other elements.",
                    column: 11,
                },
                {
                    message: "'c-d' is already included in 'a-d'.",
                    column: 15,
                },
            ],
        },
        {
            code: "/[3-6 3-6_2-4+5-7]/",
            output: "/[ _2-4+5-7]/",
            errors: [
                {
                    message:
                        "'3-6' is already included by a combination of other elements.",
                    column: 3,
                },
                {
                    message: "Unexpected duplicate '3-6'.",
                    column: 7,
                },
            ],
        },
        {
            code: "/[3-6 3-6_5-7]/",
            output: "/[3-6 _5-7]/",
            errors: [
                {
                    message:
                        "Unexpected overlap of '3-6' and '5-7' was found '[56]'.",
                    column: 3,
                },
                {
                    message: "Unexpected duplicate '3-6'.",
                    column: 7,
                },
            ],
        },
        {
            code: "/[\\s\\s \\s]/",
            output: "/[\\s ]/",
            errors: [
                { message: "Unexpected duplicate '\\s'.", column: 5 },
                { message: "' ' is already included in '\\s'.", column: 7 },
                { message: "Unexpected duplicate '\\s'.", column: 8 },
            ],
        },
        {
            code: "/[\\S\\S \\sa]/",
            output: "/[\\S \\s]/",
            errors: [
                { message: "Unexpected duplicate '\\S'.", column: 5 },
                { message: "' ' is already included in '\\s'.", column: 7 },
                { message: "'a' is already included in '\\S'.", column: 10 },
            ],
        },
        {
            code: "/[\\d 0-9_!-z]/",
            output: "/[ _!-z]/",
            errors: [
                {
                    message: "'\\d' is already included in '!-z'.",
                    column: 3,
                },
                {
                    message: "'0-9' is already included in '!-z'.",
                    column: 6,
                },
                { message: "'_' is already included in '!-z'.", column: 9 },
            ],
        },
        {
            code: "/[\\W\\W\\w \\d\\d\\D]/",
            output: "/[\\W\\w\\d\\D]/",
            errors: [
                {
                    message: "'\\W' is already included in '\\D'.",
                    column: 3,
                },
                { message: "Unexpected duplicate '\\W'.", column: 5 },
                { message: "' ' is already included in '\\W'.", column: 9 },
                {
                    message: "'\\d' is already included in '\\w'.",
                    column: 10,
                },
                {
                    message: "Unexpected duplicate '\\d'.",
                    column: 12,
                },
            ],
        },
        {
            code:
                "/[\\p{ASCII}\\P{ASCII}\\p{Script=Hiragana}\\P{Script=Hiragana}\\p{ASCII}\\p{Script=Hiragana}]/u",
            output: "/[\\P{ASCII}\\P{Script=Hiragana}\\p{Script=Hiragana}]/u",
            errors: [
                {
                    message:
                        "'\\p{ASCII}' is already included in '\\P{Script=Hiragana}'.",
                    column: 3,
                },
                {
                    message:
                        "'\\p{Script=Hiragana}' is already included in '\\P{ASCII}'.",
                    column: 21,
                },
                {
                    message: "Unexpected duplicate '\\p{ASCII}'.",
                    column: 59,
                },
                {
                    message: "Unexpected duplicate '\\p{Script=Hiragana}'.",
                    column: 68,
                },
            ],
        },
        {
            code: "/[\\p{ASCII} abc\\P{ASCII}]/u",
            output: "/[\\p{ASCII}ac\\P{ASCII}]/u",
            errors: [
                {
                    message: "' ' is already included in '\\p{ASCII}'.",
                    column: 12,
                },
                {
                    message: "'a' is already included in '\\p{ASCII}'.",
                    column: 13,
                },
                {
                    message: "'b' is already included in '\\p{ASCII}'.",
                    column: 14,
                },
                {
                    message: "'c' is already included in '\\p{ASCII}'.",
                    column: 15,
                },
            ],
        },
        {
            code: "/[\\P{Script=Hiragana} abc\\p{Script=Hiragana}]/u",
            output: "/[\\P{Script=Hiragana}ac\\p{Script=Hiragana}]/u",
            errors: [
                {
                    message:
                        "' ' is already included in '\\P{Script=Hiragana}'.",
                    column: 22,
                },
                {
                    message:
                        "'a' is already included in '\\P{Script=Hiragana}'.",
                    column: 23,
                },
                {
                    message:
                        "'b' is already included in '\\P{Script=Hiragana}'.",
                    column: 24,
                },
                {
                    message:
                        "'c' is already included in '\\P{Script=Hiragana}'.",
                    column: 25,
                },
            ],
        },
        {
            code: "/[\\w /-7+8-:]/",
            output: null,
            errors: [
                {
                    message:
                        "Unexpected overlap of '/-7' and '\\w' was found '[0-7]'.",
                    column: 6,
                },
                {
                    message:
                        "Unexpected overlap of '8-:' and '\\w' was found '[89]'.",
                    column: 10,
                },
            ],
        },
        {
            code: "/[ -/\\s]/",
            output: null,
            errors: [
                {
                    message:
                        "Unexpected overlap of ' -/' and '\\s' was found ' '.",
                    column: 3,
                },
            ],
        },
        {
            code: "/[\\wA-_]/",
            output: null,
            errors: [
                {
                    message:
                        "Unexpected overlap of 'A-_' and '\\w' was found '[A-Z_]'.",
                    column: 5,
                },
            ],
        },
        {
            code: String.raw`/[\w0-z]/`,
            output: String.raw`/[0-z]/`,
            errors: [
                {
                    message: "'\\w' is already included in '0-z'.",
                    line: 1,
                    column: 3,
                    endLine: 1,
                    endColumn: 5,
                },
            ],
        },
        {
            code: String.raw`/[\t-\uFFFF\s]/`,
            output: String.raw`/[\t-\uFFFF]/`,
            errors: [
                {
                    message: "'\\s' is already included in '\\t-\\uFFFF'.",
                    line: 1,
                    column: 12,
                    endLine: 1,
                    endColumn: 14,
                },
            ],
        },
        {
            code: "/[\\Sa]/",
            output: "/[\\S]/",
            errors: [
                {
                    message: "'a' is already included in '\\S'.",
                    column: 5,
                },
            ],
        },
        {
            code: "/[a-z\\p{L}]/u",
            output: "/[\\p{L}]/u",
            errors: [
                {
                    message: "'a-z' is already included in '\\p{L}'.",
                    column: 3,
                },
            ],
        },
        {
            code: "/[\\d\\p{ASCII}]/u",
            output: "/[\\p{ASCII}]/u",
            errors: [
                {
                    message: "'\\d' is already included in '\\p{ASCII}'.",
                    column: 3,
                },
            ],
        },
        {
            code: "/[\\t\\s]/",
            output: "/[\\s]/",
            errors: [
                {
                    message: "'\\t' is already included in '\\s'.",
                    column: 3,
                },
            ],
        },
        {
            code: String.raw`/[A-Z a-\uFFFF]/i`,
            output: String.raw`/[ a-\uFFFF]/i`,
            errors: [
                {
                    message: "'A-Z' is already included in 'a-\\uFFFF'.",
                    column: 3,
                },
            ],
        },
        {
            code: String.raw`/[\xA0-\uFFFF\s]/`,
            output: null,
            errors: [
                {
                    message:
                        "Unexpected overlap of '\\xA0-\\uFFFF' and '\\s' was found '\\xa0'.",
                    column: 3,
                },
            ],
        },
        {
            code: String.raw`/[\u1fff-\u2005\s]/`,
            output: null,
            errors: [
                {
                    message:
                        "Unexpected overlap of '\\u1fff-\\u2005' and '\\s' was found '[\\u2000-\\u2005]'.",
                    column: 3,
                },
            ],
        },
        {
            // GH issue: #189
            code: String(
                // eslint-disable-next-line no-control-regex -- x
                /[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]/i,
            ),
            output: null,
            errors: [
                {
                    message:
                        "Unexpected overlap of '\\x21-\\x5a' and '\\x53-\\x7f' was found '[A-Z]'.",
                    column: 29,
                },
            ],
        },

        // sometimes, we might have to do some escaping
        {
            code: String.raw`/[a^\w]/`,
            output: String.raw`/[\^\w]/`,
            errors: 1,
        },
        {
            code: String.raw`/[0a-a-9a-z]/`,
            output: String.raw`/[0\-9a-z]/`,
            errors: 1,
        },
        {
            code: String.raw`/[a:^\w]/`,
            output: String.raw`/[:^\w]/`,
            errors: 1,
        },
        {
            code: String.raw`/[\sa-\w]/`,
            output: String.raw`/[\s-\w]/`,
            errors: 1,
        },
        {
            code: String.raw`/[\x01\d-\x03\w]/`,
            output: String.raw`/[\x01\-\x03\w]/`,
            errors: 1,
        },
        // sometimes, we can't can't remove the element
        {
            code: String.raw`/[\x01-\d\x03\w]/`,
            output: null,
            errors: 1,
        },
        {
            code: String.raw`/[\s0-\s9]/`,
            output: null,
            errors: 1,
        },
        {
            code: "/[\\x0x9]/",
            output: null,
            errors: 1,
        },
    ],
})
