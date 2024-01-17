import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-trivially-nested-quantifier"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-trivially-nested-quantifier", rule as any, {
    valid: [
        `/(a?)+/`,
        `/(?:a{2})+/`,
        `/(?:a{3,4})+/`,
        `/(?:a+?)+/`,
        String.raw`/(?:[\q{a}])+/v`,
    ],
    invalid: [
        {
            code: String.raw`/(?:a?)+/`,
            output: String.raw`/a*/`,
            errors: [
                {
                    message:
                        "These two quantifiers are trivially nested and can be replaced with '*'.",
                },
            ],
        },
        {
            code: String.raw`/(?:a{1,2})*/`,
            output: String.raw`/a*/`,
            errors: [
                {
                    message:
                        "These two quantifiers are trivially nested and can be replaced with '*'.",
                },
            ],
        },
        {
            code: String.raw`/(?:a{1,2})+/`,
            output: String.raw`/a+/`,
            errors: [
                {
                    message:
                        "These two quantifiers are trivially nested and can be replaced with '+'.",
                },
            ],
        },
        {
            code: String.raw`/(?:a{1,2}){3,4}/`,
            output: String.raw`/a{3,8}/`,
            errors: [
                {
                    message:
                        "These two quantifiers are trivially nested and can be replaced with '{3,8}'.",
                },
            ],
        },
        {
            code: String.raw`/(?:a{2,}){4}/`,
            output: String.raw`/a{8,}/`,
            errors: [
                {
                    message:
                        "These two quantifiers are trivially nested and can be replaced with '{8,}'.",
                },
            ],
        },
        {
            code: String.raw`/(?:a{4,}){5}/`,
            output: String.raw`/a{20,}/`,
            errors: [
                {
                    message:
                        "These two quantifiers are trivially nested and can be replaced with '{20,}'.",
                },
            ],
        },
        {
            code: String.raw`/(?:a{3}){4}/`,
            output: String.raw`/a{12}/`,
            errors: [
                {
                    message:
                        "These two quantifiers are trivially nested and can be replaced with '{12}'.",
                },
            ],
        },
        {
            code: String.raw`/(?:a+|b)*/`,
            output: String.raw`/(?:a|b)*/`,
            errors: [{ message: "This nested quantifier can be removed." }],
        },
        {
            code: String.raw`/(?:a?|b)*/`,
            output: String.raw`/(?:a|b)*/`,
            errors: [{ message: "This nested quantifier can be removed." }],
        },
        {
            code: String.raw`/(?:a{0,4}|b)*/`,
            output: String.raw`/(?:a|b)*/`,
            errors: [{ message: "This nested quantifier can be removed." }],
        },
        {
            code: String.raw`/(?:a{0,4}|b)+/`,
            output: String.raw`/(?:a?|b)+/`,
            errors: [
                { message: "This nested quantifier can be simplified to '?'." },
            ],
        },
        {
            code: String.raw`/(?:a{0,4}?|b)+?/`,
            output: String.raw`/(?:a??|b)+?/`,
            errors: [
                { message: "This nested quantifier can be simplified to '?'." },
            ],
        },
        {
            code: String.raw`/(?:[\q{a}]+)+/v`,
            output: String.raw`/[\q{a}]+/v`,
            errors: [
                "These two quantifiers are trivially nested and can be replaced with '+'.",
            ],
        },
    ],
})
