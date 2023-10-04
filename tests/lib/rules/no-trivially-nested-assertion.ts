import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-trivially-nested-assertion"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-trivially-nested-assertion", rule as any, {
    valid: [
        `/(?=(?=a)b)/`,

        // these anchors cannot be negated, so they have to be allowed
        `/(?!$)/`,
        `/(?<!$)/`,
        `/(?!^)/`,
        `/(?<!^)/`,

        // the text of capturing groups inside negated lookarounds is
        // guaranteed to be reset, so we can't transform them into one
        // non-negated lookaround
        `/(?!(?!(a)))/`,

        // ES2024
        String.raw`/(?=[\q{$}])/v`,
    ],
    invalid: [
        {
            code: String(/(?=$)/),
            output: String(/$/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?=^)/),
            output: String(/^/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?<=$)/),
            output: String(/$/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?<=^)/),
            output: String(/^/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?=\b)/),
            output: String(/\b/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?!\b)/),
            output: String(/\B/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?<=\b)/),
            output: String(/\b/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?<!\b)/),
            output: String(/\B/),
            errors: [{ messageId: "unexpected" }],
        },

        // all trivially nested lookarounds can be written as one lookaround
        // Note: The inner lookaround has to be negated if the outer one is negative.
        {
            code: String(/(?=(?=a))/),
            output: String(/(?=a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?=(?!a))/),
            output: String(/(?!a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?=(?<=a))/),
            output: String(/(?<=a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?=(?<!a))/),
            output: String(/(?<!a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?!(?=a))/),
            output: String(/(?!a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?!(?!a))/),
            output: String(/(?=a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?!(?<=a))/),
            output: String(/(?<!a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?!(?<!a))/),
            output: String(/(?<=a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?<=(?=a))/),
            output: String(/(?=a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?<=(?!a))/),
            output: String(/(?!a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?<=(?<=a))/),
            output: String(/(?<=a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?<=(?<!a))/),
            output: String(/(?<!a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?<!(?=a))/),
            output: String(/(?!a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?<!(?!a))/),
            output: String(/(?=a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?<!(?<=a))/),
            output: String(/(?<!a)/),
            errors: [{ messageId: "unexpected" }],
        },
        {
            code: String(/(?<!(?<!a))/),
            output: String(/(?<=a)/),
            errors: [{ messageId: "unexpected" }],
        },
    ],
})
