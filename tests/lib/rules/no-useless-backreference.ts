import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-backreference"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-backreference", rule as any, {
    valid: ["/.(?=(b))\\1/"],
    invalid: [
        {
            code: "/(b)(\\2a)/",
            errors: [{ messageId: "nested" }],
        },
    ],
})
