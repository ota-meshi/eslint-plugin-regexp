import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-useless-quantifier"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-quantifier", rule as any, {
    valid: [
        String.raw`/a*/`,
        String.raw`/(?:a)?/`,
        String.raw`/(?:a|b?)??/`,
        String.raw`/(?:\b|a)?/`,
        String.raw`/(?:\b)*/`,
        String.raw`/(?:\b|(?!a))*/`,
        String.raw`/(?:\b|(?!))*/`,
        String.raw`/#[\da-z]+|#(?:-|([+/\\*~<>=@%|&?!])\1?)|#(?=\()/`,
    ],
    invalid: [
        // trivial
        {
            code: String.raw`/a{1}/`,
            output: String.raw`/a/`,
            errors: ["Unexpected useless quantifier."],
        },
        {
            code: String.raw`/a{1,1}?/`,
            output: String.raw`/a/`,
            errors: ["Unexpected useless quantifier."],
        },

        // empty quantified element
        {
            code: String.raw`/(?:)+/`,
            output: null,
            errors: [
                {
                    messageId: "empty",
                    suggestions: [
                        { messageId: "remove", output: String.raw`/(?:)/` },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?:[\q{}])+/v`,
            output: null,
            errors: [
                {
                    messageId: "empty",
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/(?:[\q{}])/v`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?:|(?:)){5,9}/`,
            output: null,
            errors: [
                {
                    messageId: "empty",
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/(?:|(?:))/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?:|()()())*/`,
            output: null,
            errors: [
                {
                    messageId: "empty",
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/(?:|()()())/`,
                        },
                    ],
                },
            ],
        },

        // unnecessary optional quantifier (?) because the quantified element is potentially empty
        {
            code: String.raw`/(?:a+b*|c*)?/`,
            output: null,
            errors: [
                {
                    messageId: "emptyQuestionMark",
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/(?:a+b*|c*)/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?:a|b?c?d?e?f?)?/`,
            output: null,
            errors: [
                {
                    messageId: "emptyQuestionMark",
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/(?:a|b?c?d?e?f?)/`,
                        },
                    ],
                },
            ],
        },

        // quantified elements which do not consume characters
        {
            code: String.raw`/(?:\b)+/`,
            output: null,
            errors: [
                {
                    messageId: "zeroLength",
                    suggestions: [
                        { messageId: "remove", output: String.raw`/(?:\b)/` },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?:\b){5,100}/`,
            output: null,
            errors: [
                {
                    messageId: "zeroLength",
                    suggestions: [
                        { messageId: "remove", output: String.raw`/(?:\b)/` },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?:\b|(?!a))+/`,
            output: null,
            errors: [
                {
                    messageId: "zeroLength",
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/(?:\b|(?!a))/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?:\b|(?!)){6}/`,
            output: null,
            errors: [
                {
                    messageId: "zeroLength",
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/(?:\b|(?!))/`,
                        },
                    ],
                },
            ],
        },
    ],
})
