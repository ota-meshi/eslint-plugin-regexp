import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-predefined-assertion"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-predefined-assertion", rule as any, {
    valid: [String.raw`/a(?=\W)/`],
    invalid: [
        {
            code: String.raw`/a(?=\w)/`,
            output: String.raw`/a\B/`,
            errors: [
                "This lookaround assertion can be replaced with a negated word boundary assertion ('\\B').",
            ],
        },
        {
            code: String.raw`/a(?!\w)/`,
            output: String.raw`/a\b/`,
            errors: [
                "This lookaround assertion can be replaced with a word boundary assertion ('\\b').",
            ],
        },
        {
            code: String.raw`/(?<=\w)a/`,
            output: String.raw`/\Ba/`,
            errors: [
                "This lookaround assertion can be replaced with a negated word boundary assertion ('\\B').",
            ],
        },
        {
            code: String.raw`/(?<!\w)a/`,
            output: String.raw`/\ba/`,
            errors: [
                "This lookaround assertion can be replaced with a word boundary assertion ('\\b').",
            ],
        },

        {
            code: String.raw`/a(?=\W)./`,
            output: String.raw`/a\b./`,
            errors: [
                "This lookaround assertion can be replaced with a word boundary assertion ('\\b').",
            ],
        },
        {
            code: String.raw`/a(?!\W)./`,
            output: String.raw`/a\B./`,
            errors: [
                "This lookaround assertion can be replaced with a negated word boundary assertion ('\\B').",
            ],
        },
        {
            code: String.raw`/.(?<=\W)a/`,
            output: String.raw`/.\ba/`,
            errors: [
                "This lookaround assertion can be replaced with a word boundary assertion ('\\b').",
            ],
        },
        {
            code: String.raw`/.(?<!\W)a/`,
            output: String.raw`/.\Ba/`,
            errors: [
                "This lookaround assertion can be replaced with a negated word boundary assertion ('\\B').",
            ],
        },

        {
            code: String.raw`/a+(?!\w)(?:\s|bc+)+/`,
            output: String.raw`/a+\b(?:\s|bc+)+/`,
            errors: [
                "This lookaround assertion can be replaced with a word boundary assertion ('\\b').",
            ],
        },

        {
            code: String.raw`/(?!.)(?![^])/`,
            output: String.raw`/(?!.)$/`,
            errors: [
                "This lookaround assertion can be replaced with an edge assertion ('$').",
            ],
        },
        {
            code: String.raw`/(?<!.)(?<![^])/m`,
            output: String.raw`/^(?<![^])/m`,
            errors: [
                "This lookaround assertion can be replaced with an edge assertion ('^').",
            ],
        },
    ],
})
