import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-escape"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-escape", rule as any, {
    valid: [
        String.raw`/\\/; /[\\]/`, // Escape backslash \
        String.raw`/\^/; /[\^]/`, // Escape ^
        String.raw`/\//`, // Escape /
        String.raw`/\./`, // Escape .
        String.raw`/\$/`, // Escape $
        String.raw`/a\*/`, // Escape *
        String.raw`/a\+/`, // Escape +
        String.raw`/a\?/`, // Escape ?
        String.raw`/\[\]/; /[[\]]/`, // Escape brackets []
        String.raw`/\{\}/`, // Escape braces []
        String.raw`/a\|b/`, // Escape |
        String.raw`/\(\)/`, // Escape parenthesis ()
        String.raw`/[a\-b]/`, // Escape -
        String.raw`/a\b/`, // Word boundary
        String.raw`/[\b]/`, // Backspace
        String.raw`/a\B/`, // Non-word boundary
        String.raw`/\cM/; /[\cM]/`, // Control character
        String.raw`/\d/; /[\d]/`, // Digit
        String.raw`/\D/; /[\D]/`, // Not digit
        String.raw`/\f/; /[\f]/`, // Form-feed
        String.raw`/(?<title>\w+), yes \k<title>/`, // Back reference to Named capture group
        String.raw`/\n/; /[\n]/`, // Linefeed
        String.raw`/\p{ASCII}/u; /[\p{ASCII}]/u`, // Unicode property
        String.raw`/\P{ASCII}/u; /[\P{ASCII}]/u`, // Unicode property for NOT
        String.raw`/\r/; /[\r]/`, // Carriage return
        String.raw`/\s/; /[\s]/`, // Space
        String.raw`/\S/; /[\S]/`, // Not space
        String.raw`/\t/; /[\t]/`, // Tab
        String.raw`/\v/; /[\v]/`, // Vertical tab
        String.raw`/\w/; /[\w]/`, // Work
        String.raw`/\W/; /[\W]/`, // Not work
        String.raw`/\x77/; /[\x77]/`, // Octal escape
        String.raw`/\u0041/; /[\u0041]/`, // Unicode escape
        String.raw`/\u{41}/u; /[\u{41}]/u`, // Unicode codepoint escape
        String.raw`/()\1/`, // Back reference
        String.raw`/()()\2/`, // Back reference
        String.raw`/()()()\3/`, // Back reference
        String.raw`/()()()()\4/`, // Back reference
        String.raw`/()()()()()\5/`, // Back reference
        String.raw`/()()()()()()\6/`, // Back reference
        String.raw`/()()()()()()()\7/`, // Back reference
        String.raw`/()()()()()()()()\8/`, // Back reference
        String.raw`/()()()()()()()()()\9/`, // Back reference
        String.raw`/()()()()()()()()()()\10/`, // Back reference
        String.raw`/\0/; /[\0]/`, // NUL character
        String.raw`/\1/; /[\1]/`,
        String.raw`/\2/; /[\2]/`,
        String.raw`/\3/; /[\3]/`,
        String.raw`/\4/; /[\4]/`,
        String.raw`/\5/; /[\5]/`,
        String.raw`/\6/; /[\6]/`,
        String.raw`/\7/; /[\7]/`,
        //
        String.raw`/()\1\8/; /()\1\9/`,
        "/[\\^-`]/",
    ],
    invalid: [
        {
            code: String.raw`/\a/`,
            errors: [
                {
                    message: "Unnecessary escape character: \\a.",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 3,
                },
            ],
        },
        {
            code: `/\\x7/`,
            errors: ["Unnecessary escape character: \\x."],
        },
        {
            code: `/\\u41/`,
            errors: ["Unnecessary escape character: \\u."],
        },
        {
            code: `/\\u{[41]}/`,
            errors: ["Unnecessary escape character: \\u."],
        },
        {
            code: String.raw`/[ \^ \/ \. \$ \* \+ \? \[ \{ \} \| \( \) \k<title> \B \8 \9]/`,
            errors: [
                "Unnecessary escape character: \\^.",
                "Unnecessary escape character: \\/.",
                "Unnecessary escape character: \\..",
                "Unnecessary escape character: \\$.",
                "Unnecessary escape character: \\*.",
                "Unnecessary escape character: \\+.",
                "Unnecessary escape character: \\?.",
                "Unnecessary escape character: \\[.",
                "Unnecessary escape character: \\{.",
                "Unnecessary escape character: \\}.",
                "Unnecessary escape character: \\|.",
                "Unnecessary escape character: \\(.",
                "Unnecessary escape character: \\).",
                "Unnecessary escape character: \\k.",
                "Unnecessary escape character: \\B.",
                "Unnecessary escape character: \\8.",
                "Unnecessary escape character: \\9.",
            ],
        },
        {
            code: String.raw`/\p{ASCII}/; /[\p{ASCII}]/; /\P{ASCII}/; /[\P{ASCII}]/`, // Missing u flag
            errors: [
                "Unnecessary escape character: \\p.",
                "Unnecessary escape character: \\p.",
                "Unnecessary escape character: \\P.",
                "Unnecessary escape character: \\P.",
            ],
        },
        // {
        //     code: String.raw`/\c1/`,
        //     errors: [
        //         {
        //             message: "Unnecessary escape character: \\c.",
        //             line: 1,
        //             column: 2,
        //             endLine: 1,
        //             endColumn: 3,
        //         },
        //     ],
        // },
        // {
        //     code: String.raw`/[\c]/`,
        //     errors: [
        //         {
        //             message: "Unnecessary escape character: \\c.",
        //             line: 1,
        //             column: 3,
        //             endLine: 1,
        //             endColumn: 4,
        //         },
        //     ],
        // },
    ],
})
