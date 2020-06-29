import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-empty-group"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-empty-group", rule as any, {
    valid: ["/(a)/", "/(a|)/", "/(?:a|)/"],
    invalid: [
        {
            code: "/()/",
            errors: [
                {
                    message: "Unexpected empty group.",
                    column: 2,
                    endColumn: 4,
                },
            ],
        },
        {
            code: "/(?:)/",
            errors: [
                {
                    message: "Unexpected empty group.",
                    column: 2,
                    endColumn: 6,
                },
            ],
        },
        {
            code: "/(|)/",
            errors: [
                {
                    message: "Unexpected empty group.",
                    column: 2,
                    endColumn: 5,
                },
            ],
        },
        {
            code: "/(?:|)/",
            errors: [
                {
                    message: "Unexpected empty group.",
                    column: 2,
                    endColumn: 7,
                },
            ],
        },
    ],
})
