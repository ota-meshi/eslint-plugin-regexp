import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-empty-lookarounds-assertion"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-empty-lookarounds-assertion", rule as any, {
    valid: [
        "/x(?=y)/",
        "/x(?!y)/",
        "/(?<=y)x/",
        "/(?<!y)x/",
        "/x(?=y|)/",
        "/x(?!y|)/",
        "/(?<=y|)x/",
        "/(?<!y|)x/",
        "/(^)x/",
        "/x($)/",
    ],
    invalid: [
        {
            code: "/x(?=)/",
            errors: [
                {
                    message: "Unexpected empty lookahead.",
                    column: 3,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/x(?!)/",
            errors: [
                {
                    message: "Unexpected empty lookahead.",
                    column: 3,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/(?<=)x/",
            errors: [
                {
                    message: "Unexpected empty lookbehind.",
                    column: 2,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/(?<!)x/",
            errors: [
                {
                    message: "Unexpected empty lookbehind.",
                    column: 2,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/x(?=|)/",
            errors: [
                {
                    message: "Unexpected empty lookahead.",
                    column: 3,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/x(?!|)/",
            errors: [
                {
                    message: "Unexpected empty lookahead.",
                    column: 3,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/(?<=|)x/",
            errors: [
                {
                    message: "Unexpected empty lookbehind.",
                    column: 2,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/(?<!|)x/",
            errors: [
                {
                    message: "Unexpected empty lookbehind.",
                    column: 2,
                    endColumn: 8,
                },
            ],
        },
    ],
})
