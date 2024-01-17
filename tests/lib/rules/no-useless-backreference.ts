import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-useless-backreference"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-backreference", rule as any, {
    valid: [
        "/.(?=(b))\\1/",
        "/(?:(a)|b)\\1/",
        "/(a)?\\1/",
        "/(a)\\1/",
        "/(?=(a))\\w\\1/",
        "/(?!(a)\\1)/",
    ],
    invalid: [
        {
            code: "/(b)(\\2a)/",
            errors: [{ messageId: "nested" }],
        },
        {
            code: "/(a\\1)/",
            errors: [{ messageId: "nested" }],
        },

        {
            code: "/(\\b)a\\1/",
            errors: [{ messageId: "empty" }],
        },
        {
            code: "/([\\q{}])a\\1/v",
            errors: [{ messageId: "empty" }],
        },
        {
            code: "/(\\b|a{0})a\\1/",
            errors: [{ messageId: "empty" }],
        },

        {
            code: "/(a)b|\\1/",
            errors: [{ messageId: "disjunctive" }],
        },
        {
            code: "/(?:(a)b|\\1)/",
            errors: [{ messageId: "disjunctive" }],
        },
        {
            code: "/(?<=(a)b|\\1)/",
            errors: [{ messageId: "disjunctive" }],
        },

        {
            code: "/\\1(a)/",
            errors: [{ messageId: "forward" }],
        },
        {
            code: "/(?:\\1(a))+/",
            errors: [{ messageId: "forward" }],
        },

        {
            code: "/(?<=(a)\\1)b/",
            errors: [{ messageId: "backward" }],
        },

        {
            code: "/(?!(a))\\w\\1/",
            errors: [{ messageId: "intoNegativeLookaround" }],
        },
        {
            code: "/(?!(?!(a)))\\w\\1/",
            errors: [{ messageId: "intoNegativeLookaround" }],
        },
    ],
})
