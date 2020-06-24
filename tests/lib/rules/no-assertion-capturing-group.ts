import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-assertion-capturing-group"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-assertion-capturing-group", rule as any, {
    valid: ["/(a)/", "/a(\\bb)/"],
    invalid: [
        {
            code: "/a(\\b)/",
            errors: [
                {
                    message: "Unexpected capture assertions.",
                    column: 3,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/a($)/",
            errors: [
                {
                    message: "Unexpected capture assertions.",
                    column: 3,
                    endColumn: 6,
                },
            ],
        },
        {
            code: "/(^)a/",
            errors: [
                {
                    message: "Unexpected capture assertions.",
                    column: 2,
                    endColumn: 5,
                },
            ],
        },
    ],
})
