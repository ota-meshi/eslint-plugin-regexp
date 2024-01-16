import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-zero-quantifier"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-zero-quantifier", rule as any, {
    valid: [`/a{0,1}/`, `/a{0,}/`],
    invalid: [
        {
            code: `/a{0}/`,
            errors: [
                {
                    messageId: "unexpected",
                    column: 2,
                    endColumn: 6,
                    suggestions: [{ output: `/(?:)/` }],
                },
            ],
        },
        {
            code: `/a{0}/v`,
            errors: [
                {
                    messageId: "unexpected",
                    suggestions: [{ output: `/(?:)/v` }],
                },
            ],
        },
        {
            code: `/a{0,0}/`,
            errors: [
                {
                    messageId: "unexpected",
                    column: 2,
                    endColumn: 8,
                    suggestions: [{ output: `/(?:)/` }],
                },
            ],
        },
        {
            code: `/a{0,0}?b/`,
            errors: [
                {
                    messageId: "unexpected",
                    column: 2,
                    endColumn: 9,
                    suggestions: [{ output: `/b/` }],
                },
            ],
        },
        {
            code: `/(a){0}/`,
            errors: [
                {
                    messageId: "withCapturingGroup",
                    column: 2,
                    endColumn: 8,
                    suggestions: [],
                },
            ],
        },
    ],
})
