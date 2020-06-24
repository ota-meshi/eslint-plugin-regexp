import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-exactly-quantifier"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-exactly-quantifier", rule as any, {
    valid: ["/a{2}/", "/a{0,}/", "/a{1,}/"],
    invalid: [
        {
            code: "/a{0} a{1}/",
            errors: [
                {
                    message: 'Unexpected quantifier "{0}".',
                    column: 3,
                    endColumn: 6,
                },
                {
                    message: 'Unexpected quantifier "{1}".',
                    column: 8,
                    endColumn: 11,
                },
            ],
        },
    ],
})
