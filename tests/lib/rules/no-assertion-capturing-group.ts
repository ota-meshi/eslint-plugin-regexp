import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-assertion-capturing-group"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-assertion-capturing-group", rule as any, {
    valid: ["/(a)/"],
    invalid: [
        {
            code: String.raw`/(\b)a/`,
            errors: ["Unexpected capture empty."],
        },
    ],
})
