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
        // dont check
        "/\\p{ASCII}abc/u",
        // error
        "var r = new RegExp('[\\\\wA-Za-z0-9_][invalid');",
    ],
    invalid: [
        {
            code: "var re = /[\\\\(\\\\)]/",
            errors: [
                {
                    message: "Unexpected element '\\\\' duplication.",
                    line: 1,
                    column: 12,
                },
                {
                    message: "Unexpected element '\\\\' duplication.",
                    line: 1,
                    column: 15,
                },
            ],
        },
        {
            code: "var re = /[a-z\\\\s]/",
            errors: [
                {
                    message: "The 's' is included in 'a-z'.",
                    line: 1,
                    column: 17,
                },
            ],
        },
        {
            code: "/[aaa]/",
            errors: [
                { message: "Unexpected element 'a' duplication.", column: 3 },
                { message: "Unexpected element 'a' duplication.", column: 4 },
                { message: "Unexpected element 'a' duplication.", column: 5 },
            ],
        },
        {
            code: "/[0-9\\d]/",
            errors: [
                {
                    message: "The '\\d' is included in '0-9'.",
                    column: 6,
                },
            ],
        },
        {
            code: "/[\\f\\u000C]/",
            errors: [
                { message: "Unexpected element '\\f' duplication.", column: 3 },
                {
                    message: "Unexpected element '\\u000C' duplication.",
                    column: 5,
                },
            ],
        },
        {
            code:
                "/[\\s \\f\\n\\r\\t\\v\\u00a0\\u1680\\u180e\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]/",
            errors: [
                { message: "The ' ' is included in '\\s'.", column: 5 },
                { message: "The '\\f' is included in '\\s'.", column: 6 },
                { message: "The '\\n' is included in '\\s'.", column: 8 },
                { message: "The '\\r' is included in '\\s'.", column: 10 },
                { message: "The '\\t' is included in '\\s'.", column: 12 },
                { message: "The '\\v' is included in '\\s'.", column: 14 },
                { message: "The '\\u00a0' is included in '\\s'.", column: 16 },
                { message: "The '\\u1680' is included in '\\s'.", column: 22 },
                {
                    message:
                        "Unexpected intersection of '\\u2000-\\u200a' and '\\s' was found '\\u2000-\\u200a'.",
                    column: 34,
                },
                { message: "The '\\u2028' is included in '\\s'.", column: 47 },
                { message: "The '\\u2029' is included in '\\s'.", column: 53 },
                { message: "The '\\u202f' is included in '\\s'.", column: 59 },
                { message: "The '\\u205f' is included in '\\s'.", column: 65 },
                { message: "The '\\u3000' is included in '\\s'.", column: 71 },
                { message: "The '\\ufeff' is included in '\\s'.", column: 77 },
            ],
        },
        {
            code: "/[\\t\t\\u0009]/",
            errors: [
                { message: "Unexpected element '\\t' duplication.", column: 3 },
                { message: "Unexpected element '\t' duplication.", column: 5 },
                {
                    message: "Unexpected element '\\u0009' duplication.",
                    column: 6,
                },
            ],
        },
        {
            code: "/[\\wA-Za-z0-9_]/",
            errors: [
                {
                    message:
                        "Unexpected intersection of 'A-Z' and '\\w' was found 'A-Z'.",
                    column: 5,
                },
                {
                    message:
                        "Unexpected intersection of 'a-z' and '\\w' was found 'a-z'.",
                    column: 8,
                },
                {
                    message:
                        "Unexpected intersection of '0-9' and '\\w' was found '0-9'.",
                    column: 11,
                },
                { message: "The '_' is included in '\\w'.", column: 14 },
            ],
        },
        {
            code: "/[!-z_abc-]/",
            errors: [
                { message: "The '_' is included in '!-z'.", column: 6 },
                { message: "The 'a' is included in '!-z'.", column: 7 },
                { message: "The 'b' is included in '!-z'.", column: 8 },
                { message: "The 'c' is included in '!-z'.", column: 9 },
                { message: "The '-' is included in '!-z'.", column: 10 },
            ],
        },
        {
            code: "/[\\w_abc-][\\s \\t\\r\\n\\u2000\\u3000]/",
            errors: [
                { message: "The '_' is included in '\\w'.", column: 5 },
                { message: "The 'a' is included in '\\w'.", column: 6 },
                { message: "The 'b' is included in '\\w'.", column: 7 },
                { message: "The 'c' is included in '\\w'.", column: 8 },
                { message: "The ' ' is included in '\\s'.", column: 14 },
                { message: "The '\\t' is included in '\\s'.", column: 15 },
                { message: "The '\\r' is included in '\\s'.", column: 17 },
                { message: "The '\\n' is included in '\\s'.", column: 19 },
                { message: "The '\\u2000' is included in '\\s'.", column: 21 },
                { message: "The '\\u3000' is included in '\\s'.", column: 27 },
            ],
        },
        {
            code: "/[a-z a-z]/",
            errors: [
                { message: "Unexpected element 'a-z' duplication.", column: 3 },
                { message: "Unexpected element 'a-z' duplication.", column: 7 },
            ],
        },
        {
            code: "/[a-d e-h_d-e+c-d]/",
            errors: [
                {
                    message:
                        "Unexpected intersection of 'a-d' and 'd-e' was found 'd'.",
                    column: 3,
                },
                {
                    message:
                        "Unexpected intersection of 'a-d' and 'c-d' was found 'c-d'.",
                    column: 3,
                },
                {
                    message:
                        "Unexpected intersection of 'e-h' and 'd-e' was found 'e'.",
                    column: 7,
                },
                {
                    message:
                        "Unexpected intersection of 'd-e' and 'a-d' was found 'd'.",
                    column: 11,
                },
                {
                    message:
                        "Unexpected intersection of 'd-e' and 'e-h' was found 'e'.",
                    column: 11,
                },
                {
                    message:
                        "Unexpected intersection of 'd-e' and 'c-d' was found 'd'.",
                    column: 11,
                },
                {
                    message:
                        "Unexpected intersection of 'c-d' and 'a-d' was found 'c-d'.",
                    column: 15,
                },
                {
                    message:
                        "Unexpected intersection of 'c-d' and 'd-e' was found 'd'.",
                    column: 15,
                },
            ],
        },
        {
            code: "/[3-6 3-6_2-4+5-7]/",
            errors: [
                { message: "Unexpected element '3-6' duplication.", column: 3 },
                {
                    message:
                        "Unexpected intersection of '3-6' and '2-4' was found '3-4'.",
                    column: 3,
                },
                {
                    message:
                        "Unexpected intersection of '3-6' and '5-7' was found '5-6'.",
                    column: 3,
                },
                { message: "Unexpected element '3-6' duplication.", column: 7 },
                {
                    message:
                        "Unexpected intersection of '3-6' and '2-4' was found '3-4'.",
                    column: 7,
                },
                {
                    message:
                        "Unexpected intersection of '3-6' and '5-7' was found '5-6'.",
                    column: 7,
                },
                {
                    message:
                        "Unexpected intersection of '2-4' and '3-6' was found '3-4'.",
                    column: 11,
                },
                {
                    message:
                        "Unexpected intersection of '5-7' and '3-6' was found '5-6'.",
                    column: 15,
                },
            ],
        },
        {
            code: "/[\\s\\s \\s]/",
            errors: [
                { message: "Unexpected element '\\s' duplication.", column: 3 },
                { message: "Unexpected element '\\s' duplication.", column: 5 },
                { message: "The ' ' is included in '\\s'.", column: 7 },
                { message: "Unexpected element '\\s' duplication.", column: 8 },
            ],
        },
        {
            code: "/[\\S\\S \\sa]/",
            errors: [
                { message: "Unexpected element '\\S' duplication.", column: 3 },
                { message: "Unexpected element '\\S' duplication.", column: 5 },
                { message: "The ' ' is included in '\\s'.", column: 7 },
                { message: "The 'a' is included in '\\S'.", column: 10 },
            ],
        },
        {
            code: "/[\\d 0-9_!-z]/",
            errors: [
                {
                    message: "The '\\d' is included in '0-9'.",
                    column: 3,
                },
                {
                    message: "The '\\d' is included in '!-z'.",
                    column: 3,
                },
                {
                    message:
                        "Unexpected intersection of '0-9' and '!-z' was found '0-9'.",
                    column: 6,
                },
                { message: "The '_' is included in '!-z'.", column: 9 },
                {
                    message:
                        "Unexpected intersection of '!-z' and '0-9' was found '0-9'.",
                    column: 10,
                },
            ],
        },
        {
            code: "/[\\W\\W\\w \\d\\d\\D]/",
            errors: [
                { message: "Unexpected element '\\W' duplication.", column: 3 },
                { message: "Unexpected element '\\W' duplication.", column: 5 },
                { message: "The ' ' is included in '\\W'.", column: 9 },
                { message: "The ' ' is included in '\\D'.", column: 9 },
                {
                    message: "Unexpected element '\\d' duplication.",
                    column: 10,
                },
                {
                    message: "Unexpected element '\\d' duplication.",
                    column: 12,
                },
            ],
        },
        {
            code:
                "/[\\p{ASCII}\\P{ASCII}\\p{Script=Hiragana}\\P{Script=Hiragana}\\p{ASCII}\\p{Script=Hiragana}]/u",
            errors: [
                {
                    message: "Unexpected element '\\p{ASCII}' duplication.",
                    column: 3,
                },
                {
                    message:
                        "Unexpected element '\\p{Script=Hiragana}' duplication.",
                    column: 21,
                },
                {
                    message: "Unexpected element '\\p{ASCII}' duplication.",
                    column: 59,
                },
                {
                    message:
                        "Unexpected element '\\p{Script=Hiragana}' duplication.",
                    column: 68,
                },
            ],
        },
        {
            code: "/[\\p{ASCII} abc\\P{ASCII}]/u",
            errors: [
                {
                    message: "The ' ' is included in '\\p{ASCII}'.",
                    column: 12,
                },
                {
                    message: "The 'a' is included in '\\p{ASCII}'.",
                    column: 13,
                },
                {
                    message: "The 'b' is included in '\\p{ASCII}'.",
                    column: 14,
                },
                {
                    message: "The 'c' is included in '\\p{ASCII}'.",
                    column: 15,
                },
            ],
        },
        {
            code: "/[\\P{Script=Hiragana} abc\\p{Script=Hiragana}]/u",
            errors: [
                {
                    message: "The ' ' is included in '\\P{Script=Hiragana}'.",
                    column: 22,
                },
                {
                    message: "The 'a' is included in '\\P{Script=Hiragana}'.",
                    column: 23,
                },
                {
                    message: "The 'b' is included in '\\P{Script=Hiragana}'.",
                    column: 24,
                },
                {
                    message: "The 'c' is included in '\\P{Script=Hiragana}'.",
                    column: 25,
                },
            ],
        },
        {
            code: "/[\\w /-7+8-:]/",
            errors: [
                {
                    message:
                        "Unexpected intersection of '/-7' and '\\w' was found '0-7'.",
                    column: 6,
                },
                {
                    message:
                        "Unexpected intersection of '8-:' and '\\w' was found '8-9'.",
                    column: 10,
                },
            ],
        },
        {
            code: "/[ -/\\s]/",
            errors: [
                {
                    message:
                        "Unexpected intersection of ' -/' and '\\s' was found ' '.",
                    column: 3,
                },
            ],
        },
        {
            code: "/[\\wA-_]/",
            errors: [
                {
                    message:
                        "Unexpected intersection of 'A-_' and '\\w' was found '_'.",
                    column: 5,
                },
                {
                    message:
                        "Unexpected intersection of 'A-_' and '\\w' was found 'A-Z'.",
                    column: 5,
                },
            ],
        },
        {
            code: String.raw`/[\w0-z]/`,
            errors: [
                {
                    message: "The '\\w' is included in '0-z'.",
                    line: 1,
                    column: 3,
                    endLine: 1,
                    endColumn: 5,
                },
            ],
        },
        {
            code: String.raw`/[\t-\uFFFF\s]/`,
            errors: [
                {
                    message: "The '\\s' is included in '\\t-\\uFFFF'.",
                    line: 1,
                    column: 12,
                    endLine: 1,
                    endColumn: 14,
                },
            ],
        },
        {
            code: "/[\\Sa]/",
            errors: [
                {
                    message: "The 'a' is included in '\\S'.",
                    column: 5,
                },
            ],
        },
    ],
})
