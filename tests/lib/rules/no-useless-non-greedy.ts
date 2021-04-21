import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-non-greedy"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-non-greedy", rule as any, {
    valid: [`/a*?/`],
    invalid: [
        {
            code: `/a{1}?/`,
            output: `/a{1}/`,
            errors: 1,
        },
    ],
})
