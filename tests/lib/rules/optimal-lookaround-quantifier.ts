import { RuleTester } from "eslint"
import rule from "../../../lib/rules/optimal-lookaround-quantifier"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("optimal-lookaround-quantifier", rule as any, {
    valid: [String.raw`/(?=(a*))\w+\1/`, `/(?<=a{4})/`, `/(?=a(?:(a)|b)*)/`],
    invalid: [
        {
            code: `/(?=ba*)/`,
            errors: [
                {
                    message:
                        "The quantified expression 'a*' at the end of the expression tree should only be matched a constant number of times. The expression can be removed without affecting the lookaround.",
                    column: 6,
                    suggestions: [{ output: `/(?=b)/` }],
                },
            ],
        },
        {
            code: `/(?=(?:a|b|abc*))/`,
            errors: [
                {
                    message:
                        "The quantified expression 'c*' at the end of the expression tree should only be matched a constant number of times. The expression can be removed without affecting the lookaround.",
                    column: 14,
                    suggestions: [{ output: `/(?=(?:a|b|ab))/` }],
                },
            ],
        },
        {
            code: `/(?=(?:a|b|abc+))/`,
            errors: [
                {
                    message:
                        "The quantified expression 'c+' at the end of the expression tree should only be matched a constant number of times. The expression can be replaced with 'c' (no quantifier) without affecting the lookaround.",
                    column: 14,
                    suggestions: [{ output: `/(?=(?:a|b|abc))/` }],
                },
            ],
        },
        {
            code: `/(?=(?:a|b|abc{4,9}))/`,
            errors: [
                {
                    message:
                        "The quantified expression 'c{4,9}' at the end of the expression tree should only be matched a constant number of times. The expression can be replaced with 'c{4}' without affecting the lookaround.",
                    column: 14,
                    suggestions: [{ output: `/(?=(?:a|b|abc{4}))/` }],
                },
            ],
        },
        {
            code: `/(?<=[a-c]*)/`,
            errors: [
                {
                    message:
                        "The quantified expression '[a-c]*' at the start of the expression tree should only be matched a constant number of times. The expression can be removed without affecting the lookaround.",
                    column: 6,
                    suggestions: [{ output: `/(?<=)/` }],
                },
            ],
        },
        {
            code: `/(?<=(?:d|c)*ab)/`,
            errors: [
                {
                    message:
                        "The quantified expression '(?:d|c)*' at the start of the expression tree should only be matched a constant number of times. The expression can be removed without affecting the lookaround.",
                    column: 6,
                    suggestions: [{ output: `/(?<=ab)/` }],
                },
            ],
        },
    ],
})
