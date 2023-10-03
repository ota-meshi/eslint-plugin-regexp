import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-empty-lookarounds-assertion"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-empty-lookarounds-assertion", rule as any, {
    valid: [
        "/x(?=y)/",
        "/x(?!y)/",
        "/(?<=y)x/",
        "/(?<!y)x/",
        "/(^)x/",
        "/x($)/",
        "/(?=(?=.).*)/",
        "/(?=$|a)/",
        "/(?=\\ba*\\b)/",
        '/b?r(#*)"(?:[^"]|"(?!\\1))*"\\1/',
        String.raw`/x(?=[\q{a}])/v`,
    ],
    invalid: [
        {
            code: "/x(?=)/",
            errors: [
                {
                    message:
                        "Unexpected empty lookahead. It will trivially accept all inputs.",
                    column: 3,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/x(?!)/",
            errors: [
                {
                    message:
                        "Unexpected empty lookahead. It will trivially reject all inputs.",
                    column: 3,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/(?<=)x/",
            errors: [
                {
                    message:
                        "Unexpected empty lookbehind. It will trivially accept all inputs.",
                    column: 2,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/(?<!)x/",
            errors: [
                {
                    message:
                        "Unexpected empty lookbehind. It will trivially reject all inputs.",
                    column: 2,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/x(?=|)/",
            errors: [
                {
                    message:
                        "Unexpected empty lookahead. It will trivially accept all inputs.",
                    column: 3,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/x(?!|)/",
            errors: [
                {
                    message:
                        "Unexpected empty lookahead. It will trivially reject all inputs.",
                    column: 3,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/(?<=|)x/",
            errors: [
                {
                    message:
                        "Unexpected empty lookbehind. It will trivially accept all inputs.",
                    column: 2,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/(?<!|)x/",
            errors: [
                {
                    message:
                        "Unexpected empty lookbehind. It will trivially reject all inputs.",
                    column: 2,
                    endColumn: 8,
                },
            ],
        },

        {
            code: "/x(?=y|)/",
            errors: [
                {
                    message:
                        "Unexpected empty lookahead. It will trivially accept all inputs.",
                    column: 3,
                    endColumn: 9,
                },
            ],
        },
        {
            code: "/x(?!y|)/",
            errors: [
                {
                    message:
                        "Unexpected empty lookahead. It will trivially reject all inputs.",
                    column: 3,
                    endColumn: 9,
                },
            ],
        },
        {
            code: "/(?<=y|)x/",
            errors: [
                {
                    message:
                        "Unexpected empty lookbehind. It will trivially accept all inputs.",
                    column: 2,
                    endColumn: 9,
                },
            ],
        },
        {
            code: "/(?<!y|)x/",
            errors: [
                {
                    message:
                        "Unexpected empty lookbehind. It will trivially reject all inputs.",
                    column: 2,
                    endColumn: 9,
                },
            ],
        },

        {
            code: "/(?=a*)/",
            errors: [
                {
                    message:
                        "Unexpected empty lookahead. It will trivially accept all inputs.",
                },
            ],
        },
        {
            code: "/(?=a|b*)/",
            errors: [
                {
                    message:
                        "Unexpected empty lookahead. It will trivially accept all inputs.",
                },
            ],
        },
        {
            code: String.raw`/x(?=[\q{}])/v`,
            errors: [
                {
                    message:
                        "Unexpected empty lookahead. It will trivially accept all inputs.",
                },
            ],
        },
    ],
})
