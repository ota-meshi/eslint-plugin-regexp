import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-question-quantifier"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-question-quantifier", rule as any, {
    valid: ["/a?/", "/a??/", "/(a?)/", "/(a??)/", "/[a{0,1}]/", "/[a{0,}]/"],
    invalid: [
        {
            code: "/a{0,1}/",
            output: "/a?/",
            errors: [
                {
                    message: 'Unexpected quantifier "{0,1}". Use "?" instead.',
                    column: 3,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/a{0,1}?/",
            output: "/a??/",
            errors: [
                {
                    message: 'Unexpected quantifier "{0,1}". Use "?" instead.',
                    column: 3,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/(a){0,1}/",
            output: "/(a)?/",
            errors: [
                {
                    message: 'Unexpected quantifier "{0,1}". Use "?" instead.',
                    column: 5,
                    endColumn: 10,
                },
            ],
        },
        {
            code: "/(a){0,1}?/",
            output: "/(a)??/",
            errors: [
                {
                    message: 'Unexpected quantifier "{0,1}". Use "?" instead.',
                    column: 5,
                    endColumn: 10,
                },
            ],
        },
    ],
})
