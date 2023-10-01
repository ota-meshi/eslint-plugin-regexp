import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-named-backreference"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-named-backreference", rule as any, {
    valid: [`/(a)\\1/`, `/(?<foo>a)\\k<foo>/`, `/(a)\\1 (?<foo>a)\\k<foo>/`],
    invalid: [
        {
            code: `/(?<foo>a)\\1/`,
            output: `/(?<foo>a)\\k<foo>/`,
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: `/(?<foo>a)\\1/v`,
            output: `/(?<foo>a)\\k<foo>/v`,
            errors: [{ messageId: "unexpected" }],
        },
    ],
})
