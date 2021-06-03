import { RuleTester } from "eslint"
import rule from "../../../lib/rules/sort-alternatives"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("sort-alternatives", rule as any, {
    valid: [`/regexp/`],
    invalid: [
        {
            code: `/regexp/`,
            errors: [
                {
                    messageId: "",
                    data: {},
                    line: 1,
                    column: 1,
                    endLine: 1,
                    endColumn: 1,
                },
            ],
        },
    ],
})
