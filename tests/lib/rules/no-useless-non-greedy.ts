import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-non-greedy"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-non-greedy", rule as any, {
    valid: [`/a*?/`, `/a+?/`, `/a{4,}?/`, `/a{2,4}?/`, `/a{2,2}/`, `/a{3}/`],
    invalid: [
        {
            code: `/a{1}?/`,
            output: `/a{1}/`,
            errors: [
                {
                    message: "Unexpected quantifier non-greedy.",
                    line: 1,
                    column: 6,
                    endLine: 1,
                    endColumn: 7,
                },
            ],
        },
        {
            code: `/a{4}?/`,
            output: `/a{4}/`,
            errors: [
                {
                    message: "Unexpected quantifier non-greedy.",
                    line: 1,
                    column: 6,
                    endLine: 1,
                    endColumn: 7,
                },
            ],
        },
        {
            code: `/a{2,2}?/`,
            output: `/a{2,2}/`,
            errors: ["Unexpected quantifier non-greedy."],
        },
    ],
})
