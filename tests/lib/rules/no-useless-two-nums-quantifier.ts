import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-two-nums-quantifier"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-two-nums-quantifier", rule as any, {
    valid: ["/a{1,2}/", "/a{1,}/", "/a{1}/", "/a?/"],
    invalid: [
        {
            code: "/a{1,1}/",
            errors: [
                {
                    message: 'Unexpected quantifier "{1,1}".',
                    column: 3,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/a{42,42}/",
            errors: ['Unexpected quantifier "{42,42}".'],
        },
        {
            code: "/a{042,42}/",
            errors: ['Unexpected quantifier "{042,42}".'],
        },
    ],
})
