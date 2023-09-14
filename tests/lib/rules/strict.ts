import { RuleTester } from "eslint"
import rule from "../../../lib/rules/strict"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("strict", rule as any, {
    valid: [
        `/regexp/`,
        String.raw`/\{\}\]/`,
        String.raw`/[-\w-]/`,
        String.raw`/[a-b-\w]/`,
        String.raw`/\0/`,
        String.raw`/()\1/`,
        String.raw`/(?<foo>)\k<foo>/`,
        String.raw`/\p{L}/u`,
        String.raw`/ \( \) \[ \] \{ \} \| \* \+ \? \^ \$ \\ \/ \./`,
        String.raw`/[\( \) \[ \] \{ \} \| \* \+ \? \^ \$ \\ \/ \. \-]/`,
        "/\\u000f/",
        "/\\x000f/",
        String.raw`/[A--B]/v`,
    ],
    invalid: [
        // source characters
        {
            code: String.raw`/]/`,
            output: String.raw`/\]/`,
            errors: [
                {
                    message: "Unescaped source character ']'.",
                    column: 2,
                },
            ],
        },
        {
            code: String.raw`/{/`,
            output: String.raw`/\{/`,
            errors: [
                {
                    message: "Unescaped source character '{'.",
                    column: 2,
                },
            ],
        },
        {
            code: String.raw`/}/`,
            output: String.raw`/\}/`,
            errors: [
                {
                    message: "Unescaped source character '}'.",
                    column: 2,
                },
            ],
        },

        // invalid or incomplete escape sequences
        {
            code: String.raw`/\u{42}/`,
            output: null,
            errors: [
                {
                    message:
                        "Incomplete escape sequence '\\u'. Either use a valid escape sequence or remove the useless escaping.",
                    column: 2,
                },
            ],
        },
        {
            code: "/\\u000;/",
            output: null,
            errors: [
                {
                    message:
                        "Incomplete escape sequence '\\u'. Either use a valid escape sequence or remove the useless escaping.",
                    column: 2,
                },
            ],
        },
        {
            code: "/\\x4/",
            output: null,
            errors: [
                {
                    message:
                        "Incomplete escape sequence '\\x'. Either use a valid escape sequence or remove the useless escaping.",
                    column: 2,
                },
            ],
        },
        {
            code: "/\\c;/",
            output: null,
            errors: [
                {
                    message:
                        "Invalid or incomplete control escape sequence. Either use a valid control escape sequence or escaping the standalone backslash.",
                    column: 2,
                },
            ],
        },
        {
            code: "/\\p/",
            output: null,
            errors: [
                {
                    message:
                        "Invalid property escape sequence '\\p'. Either use a valid property escape sequence or remove the useless escaping.",
                    column: 2,
                },
            ],
        },
        {
            code: "/\\p{H}/",
            output: "/\\p\\{H\\}/",
            errors: [
                {
                    message:
                        "Invalid property escape sequence '\\p'. Either use a valid property escape sequence or remove the useless escaping.",
                    column: 2,
                },
                {
                    message: "Unescaped source character '{'.",
                    column: 4,
                },
                {
                    message: "Unescaped source character '}'.",
                    column: 6,
                },
            ],
        },
        {
            code: "/\\012/",
            output: null,
            errors: [
                {
                    message:
                        "Invalid legacy octal escape sequence '\\012'. Use a hexadecimal escape instead.",
                    column: 2,
                    suggestions: [
                        {
                            output: "/\\x0a/",
                            desc: "Replace the octal escape with a hexadecimal escape.",
                        },
                    ],
                },
            ],
        },
        {
            code: "/\\12/",
            output: null,
            errors: [
                {
                    message:
                        "Invalid legacy octal escape sequence '\\12'. Use a hexadecimal escape instead.",
                    column: 2,
                    suggestions: [
                        {
                            output: "/\\x0a/",
                            desc: "Replace the octal escape with a hexadecimal escape.",
                        },
                    ],
                },
            ],
        },

        // incomplete backreference
        {
            code: "/\\k<foo/",
            output: null,
            errors: [
                {
                    message:
                        "Incomplete backreference '\\k'. Either use a valid backreference or remove the useless escaping.",
                    column: 2,
                },
            ],
        },
        {
            code: "/\\k<foo>/",
            output: null,
            errors: [
                {
                    message:
                        "Incomplete backreference '\\k'. Either use a valid backreference or remove the useless escaping.",
                    column: 2,
                },
            ],
        },

        // useless escape
        {
            code: "/\\; \\_ \\a \\- \\'/",
            output: "/; _ a - '/",
            errors: [
                {
                    message:
                        "Useless identity escapes with non-syntax characters are forbidden.",
                    column: 2,
                },
                {
                    message:
                        "Useless identity escapes with non-syntax characters are forbidden.",
                    column: 5,
                },
                {
                    message:
                        "Useless identity escapes with non-syntax characters are forbidden.",
                    column: 8,
                },
                {
                    message:
                        "Useless identity escapes with non-syntax characters are forbidden.",
                    column: 11,
                },
                {
                    message:
                        "Useless identity escapes with non-syntax characters are forbidden.",
                    column: 14,
                },
            ],
        },
        {
            code: "/[\\; \\_ \\a \\']/",
            output: "/[; _ a ']/",
            errors: [
                {
                    message:
                        "Useless identity escapes with non-syntax characters are forbidden.",
                    column: 3,
                },
                {
                    message:
                        "Useless identity escapes with non-syntax characters are forbidden.",
                    column: 6,
                },
                {
                    message:
                        "Useless identity escapes with non-syntax characters are forbidden.",
                    column: 9,
                },
                {
                    message:
                        "Useless identity escapes with non-syntax characters are forbidden.",
                    column: 12,
                },
            ],
        },

        // invalid ranges
        {
            code: String.raw`/[\w-a]/`,
            output: null,
            errors: [
                {
                    message:
                        "Invalid character class range. A character set cannot be the minimum or maximum of a character class range. Either escape the `-` or fix the character class range.",
                    column: 3,
                },
            ],
        },
        {
            code: String.raw`/[a-\w]/`,
            output: null,
            errors: [
                {
                    message:
                        "Invalid character class range. A character set cannot be the minimum or maximum of a character class range. Either escape the `-` or fix the character class range.",
                    column: 5,
                },
            ],
        },

        // quantified assertions
        {
            code: String.raw`/(?!a)+/`,
            output: String.raw`/(?:(?!a))+/`,
            errors: [
                {
                    message:
                        "Assertion are not allowed to be quantified directly.",
                    column: 2,
                },
            ],
        },
    ],
})
