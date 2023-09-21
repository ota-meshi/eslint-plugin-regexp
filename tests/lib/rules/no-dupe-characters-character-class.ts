import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-dupe-characters-character-class"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
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
        String.raw`/[\q{a}\q{ab}\q{abc}[\w--[ab]][\w&&b]]/v`,
        // error
        "var r = new RegExp('[\\\\wA-Za-z0-9_][invalid');",
    ],
    invalid: [
        {
            code: "var re = /[\\\\(\\\\)]/",
            output: "var re = /[\\\\()]/",
            errors: [
                {
                    message: "Unexpected duplicate '\\\\' (U+005c).",
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
                    message:
                        "'s' (U+0073) is already included in 'a-z' (U+0061 - U+007a).",
                    line: 1,
                    column: 17,
                },
            ],
        },
        {
            code: "/[aaa]/",
            output: "/[aa]/",
            errors: [
                { message: "Unexpected duplicate 'a' (U+0061).", column: 4 },
                { message: "Unexpected duplicate 'a' (U+0061).", column: 5 },
            ],
        },
        {
            code: "/[0-9\\d]/",
            output: "/[\\d]/",
            errors: [
                {
                    message:
                        "'0-9' (U+0030 - U+0039) is already included in '\\d'.",
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
                        "Unexpected duplicate. '\\u000C' (U+000c) is a duplicate of '\\f' (U+000c).",
                    column: 5,
                },
            ],
        },
        {
            code: "RegExp(/[bb]/)",
            output: "RegExp(/[b]/)",
            errors: [
                {
                    message: "Unexpected duplicate 'b' (U+0062).",
                    column: 11,
                },
            ],
        },
        {
            code: "/[\\s \\f\\n\\r\\t\\v\\u00a0\\u1680\\u180e\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]/",
            output: "/[\\s\\f\\r\\v\\u1680\\u180e\\u2028\\u202f\\u3000]/",
            errors: [
                {
                    message: "' ' (U+0020) is already included in '\\s'.",
                    column: 5,
                },
                {
                    message: "'\\f' (U+000c) is already included in '\\s'.",
                    column: 6,
                },
                {
                    message: "'\\n' (U+000a) is already included in '\\s'.",
                    column: 8,
                },
                {
                    message: "'\\r' (U+000d) is already included in '\\s'.",
                    column: 10,
                },
                {
                    message: "'\\t' (U+0009) is already included in '\\s'.",
                    column: 12,
                },
                {
                    message: "'\\v' (U+000b) is already included in '\\s'.",
                    column: 14,
                },
                {
                    message: "'\\u00a0' (U+00a0) is already included in '\\s'.",
                    column: 16,
                },
                {
                    message: "'\\u1680' (U+1680) is already included in '\\s'.",
                    column: 22,
                },
                {
                    message:
                        "'\\u2000-\\u200a' (U+2000 - U+200a) is already included in '\\s'.",
                    column: 34,
                },
                {
                    message: "'\\u2028' (U+2028) is already included in '\\s'.",
                    column: 47,
                },
                {
                    message: "'\\u2029' (U+2029) is already included in '\\s'.",
                    column: 53,
                },
                {
                    message: "'\\u202f' (U+202f) is already included in '\\s'.",
                    column: 59,
                },
                {
                    message: "'\\u205f' (U+205f) is already included in '\\s'.",
                    column: 65,
                },
                {
                    message: "'\\u3000' (U+3000) is already included in '\\s'.",
                    column: 71,
                },
                {
                    message: "'\\ufeff' (U+feff) is already included in '\\s'.",
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
                        "Unexpected duplicate. '\t' (U+0009) is a duplicate of '\\t' (U+0009).",
                    column: 5,
                },
                {
                    message:
                        "Unexpected duplicate. '\\u0009' (U+0009) is a duplicate of '\\t' (U+0009).",
                    column: 7,
                },
            ],
        },
        {
            code: "/[\\wA-Z a-z:0-9,_]/",
            output: "/[\\w :,]/",
            errors: [
                {
                    message:
                        "'A-Z' (U+0041 - U+005a) is already included in '\\w'.",
                    column: 5,
                },
                {
                    message:
                        "'a-z' (U+0061 - U+007a) is already included in '\\w'.",
                    column: 9,
                },
                {
                    message:
                        "'0-9' (U+0030 - U+0039) is already included in '\\w'.",
                    column: 13,
                },
                {
                    message: "'_' (U+005f) is already included in '\\w'.",
                    column: 17,
                },
            ],
        },
        {
            code: "/[!-z_abc-]/",
            output: "/[!-zac]/",
            errors: [
                {
                    message:
                        "'_' (U+005f) is already included in '!-z' (U+0021 - U+007a).",
                    column: 6,
                },
                {
                    message:
                        "'a' (U+0061) is already included in '!-z' (U+0021 - U+007a).",
                    column: 7,
                },
                {
                    message:
                        "'b' (U+0062) is already included in '!-z' (U+0021 - U+007a).",
                    column: 8,
                },
                {
                    message:
                        "'c' (U+0063) is already included in '!-z' (U+0021 - U+007a).",
                    column: 9,
                },
                {
                    message:
                        "'-' (U+002d) is already included in '!-z' (U+0021 - U+007a).",
                    column: 10,
                },
            ],
        },
        {
            code: "/[\\w_abc-][\\s \\t\\r\\n\\u2000\\u3000]/",
            output: "/[\\wac-][\\s\\t\\n\\u3000]/",
            errors: [
                {
                    message: "'_' (U+005f) is already included in '\\w'.",
                    column: 5,
                },
                {
                    message: "'a' (U+0061) is already included in '\\w'.",
                    column: 6,
                },
                {
                    message: "'b' (U+0062) is already included in '\\w'.",
                    column: 7,
                },
                {
                    message: "'c' (U+0063) is already included in '\\w'.",
                    column: 8,
                },
                {
                    message: "' ' (U+0020) is already included in '\\s'.",
                    column: 14,
                },
                {
                    message: "'\\t' (U+0009) is already included in '\\s'.",
                    column: 15,
                },
                {
                    message: "'\\r' (U+000d) is already included in '\\s'.",
                    column: 17,
                },
                {
                    message: "'\\n' (U+000a) is already included in '\\s'.",
                    column: 19,
                },
                {
                    message: "'\\u2000' (U+2000) is already included in '\\s'.",
                    column: 21,
                },
                {
                    message: "'\\u3000' (U+3000) is already included in '\\s'.",
                    column: 27,
                },
            ],
        },
        {
            code: "/[a-z a-z]/",
            output: "/[a-z ]/",
            errors: [
                {
                    message: "Unexpected duplicate 'a-z' (U+0061 - U+007a).",
                    column: 7,
                },
            ],
        },
        {
            code: "/[a-z A-Z]/i",
            output: "/[a-z ]/i",
            errors: [
                {
                    message:
                        "Unexpected duplicate. 'A-Z' (U+0041 - U+005a) is a duplicate of 'a-z' (U+0061 - U+007a).",
                    column: 7,
                },
            ],
        },
        {
            code: "/[a-d e-h_d-e+c-d]/",
            output: "/[a-d e-h_+]/",
            errors: [
                {
                    message:
                        "'d-e' (U+0064 - U+0065) is already included by the elements 'a-de-h' ('a-d' (U+0061 - U+0064), 'e-h' (U+0065 - U+0068)).",
                    column: 11,
                },
                {
                    message:
                        "'c-d' (U+0063 - U+0064) is already included in 'a-d' (U+0061 - U+0064).",
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
                        "'3-6' (U+0033 - U+0036) is already included by the elements '2-45-7' ('2-4' (U+0032 - U+0034), '5-7' (U+0035 - U+0037)).",
                    column: 3,
                },
                {
                    message: "Unexpected duplicate '3-6' (U+0033 - U+0036).",
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
                        "Unexpected overlap of '3-6' (U+0033 - U+0036) and '5-7' (U+0035 - U+0037) was found '[56]'.",
                    column: 3,
                },
                {
                    message: "Unexpected duplicate '3-6' (U+0033 - U+0036).",
                    column: 7,
                },
            ],
        },
        {
            code: "/[\\s\\s \\s]/",
            output: "/[\\s ]/",
            errors: [
                { message: "Unexpected duplicate '\\s'.", column: 5 },
                {
                    message: "' ' (U+0020) is already included in '\\s'.",
                    column: 7,
                },
                { message: "Unexpected duplicate '\\s'.", column: 8 },
            ],
        },
        {
            code: "/[\\S\\S \\sa]/",
            output: "/[\\S \\s]/",
            errors: [
                { message: "Unexpected duplicate '\\S'.", column: 5 },
                {
                    message: "' ' (U+0020) is already included in '\\s'.",
                    column: 7,
                },
                {
                    message: "'a' (U+0061) is already included in '\\S'.",
                    column: 10,
                },
            ],
        },
        {
            code: "/[\\d 0-9_!-z]/",
            output: "/[ _!-z]/",
            errors: [
                {
                    message:
                        "'\\d' is already included in '!-z' (U+0021 - U+007a).",
                    column: 3,
                },
                {
                    message:
                        "'0-9' (U+0030 - U+0039) is already included in '!-z' (U+0021 - U+007a).",
                    column: 6,
                },
                {
                    message:
                        "'_' (U+005f) is already included in '!-z' (U+0021 - U+007a).",
                    column: 9,
                },
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
                {
                    message: "' ' (U+0020) is already included in '\\W'.",
                    column: 9,
                },
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
            code: "/[\\p{ASCII}\\P{ASCII}\\p{Script=Hiragana}\\P{Script=Hiragana}\\p{ASCII}\\p{Script=Hiragana}]/u",
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
                    message:
                        "' ' (U+0020) is already included in '\\p{ASCII}'.",
                    column: 12,
                },
                {
                    message:
                        "'a' (U+0061) is already included in '\\p{ASCII}'.",
                    column: 13,
                },
                {
                    message:
                        "'b' (U+0062) is already included in '\\p{ASCII}'.",
                    column: 14,
                },
                {
                    message:
                        "'c' (U+0063) is already included in '\\p{ASCII}'.",
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
                        "' ' (U+0020) is already included in '\\P{Script=Hiragana}'.",
                    column: 22,
                },
                {
                    message:
                        "'a' (U+0061) is already included in '\\P{Script=Hiragana}'.",
                    column: 23,
                },
                {
                    message:
                        "'b' (U+0062) is already included in '\\P{Script=Hiragana}'.",
                    column: 24,
                },
                {
                    message:
                        "'c' (U+0063) is already included in '\\P{Script=Hiragana}'.",
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
                        "Unexpected overlap of '/-7' (U+002f - U+0037) and '\\w' was found '[0-7]'.",
                    column: 6,
                },
                {
                    message:
                        "Unexpected overlap of '8-:' (U+0038 - U+003a) and '\\w' was found '[89]'.",
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
                        "Unexpected overlap of ' -/' (U+0020 - U+002f) and '\\s' was found ' '.",
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
                        "Unexpected overlap of 'A-_' (U+0041 - U+005f) and '\\w' was found '[A-Z_]'.",
                    column: 5,
                },
            ],
        },
        {
            code: String.raw`/[\w0-z]/`,
            output: String.raw`/[0-z]/`,
            errors: [
                {
                    message:
                        "'\\w' is already included in '0-z' (U+0030 - U+007a).",
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
                    message:
                        "'\\s' is already included in '\\t-\\uFFFF' (U+0009 - U+ffff).",
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
                    message: "'a' (U+0061) is already included in '\\S'.",
                    column: 5,
                },
            ],
        },
        {
            code: "/[a-z\\p{L}]/u",
            output: "/[\\p{L}]/u",
            errors: [
                {
                    message:
                        "'a-z' (U+0061 - U+007a) is already included in '\\p{L}'.",
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
                    message: "'\\t' (U+0009) is already included in '\\s'.",
                    column: 3,
                },
            ],
        },
        {
            code: String.raw`/[A-Z a-\uFFFF]/i`,
            output: String.raw`/[ a-\uFFFF]/i`,
            errors: [
                {
                    message:
                        "'A-Z' (U+0041 - U+005a) is already included in 'a-\\uFFFF' (U+0061 - U+ffff).",
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
                        "Unexpected overlap of '\\xA0-\\uFFFF' (U+00a0 - U+ffff) and '\\s' was found '\\xa0'.",
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
                        "Unexpected overlap of '\\u1fff-\\u2005' (U+1fff - U+2005) and '\\s' was found '[\\u2000-\\u2005]'.",
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
                        "Unexpected overlap of '\\x21-\\x5a' (U+0021 - U+005a) and '\\x53-\\x7f' (U+0053 - U+007f) was found '[A-Z]'.",
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
        // v flags
        {
            code: String.raw`/[\q{a}aa-c[\w--b][\w&&a]]/v`,
            output: String.raw`/[aa-c[\w--b]]/v`,
            errors: [
                "'\\q{a}' is already included in 'a-c' (U+0061 - U+0063).",
                "'a' (U+0061) is already included in 'a-c' (U+0061 - U+0063).",
                "Unexpected overlap of 'a-c' (U+0061 - U+0063) and '[\\w--b]' was found '[ac]'.",
                "'[\\w&&a]' is already included in 'a-c' (U+0061 - U+0063).",
            ],
        },
        {
            code: String.raw`/[\q{abc}\q{abc|ab}[\q{abc}--b][\q{abc}&&\q{abc|ab}]]/v`,
            output: String.raw`/[\q{abc|ab}[\q{abc}&&\q{abc|ab}]]/v`,
            errors: [
                "'\\q{abc}' is already included in '\\q{abc|ab}'.",
                "'[\\q{abc}--b]' is already included in '\\q{abc|ab}'.",
                "'[\\q{abc}&&\\q{abc|ab}]' is already included in '\\q{abc|ab}'.",
            ],
        },
    ],
})
