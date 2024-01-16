import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-empty-group"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-empty-group", rule as any, {
    valid: ["/(a)/", "/(a|)/", "/(?:a|)/", String.raw`/(?:a|[\q{}])/v`],
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
