import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-super-linear-backtracking"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-super-linear-backtracking", rule as any, {
    valid: [
        String.raw`/regexp/`,
        String.raw`/a+b+a+b+/`,
        String.raw`/\w+\b[\w-]+/`,
        String.raw`/[\q{ab}]*[\q{ab}]*$/v`, // Limitation of scslre
    ],
    invalid: [
        // self
        {
            code: String.raw`/b(?:a+)+b/`,
            output: String.raw`/ba+b/`,
            errors: [
                "This quantifier can reach itself via the loop '(?:a+)+'. Using any string accepted by /a+/, this can be exploited to cause at least polynomial backtracking. This is going to cause exponential backtracking resulting in exponential worst-case runtime behavior.",
            ],
        },
        {
            code: String.raw`/(?:ba+|a+b){2}/`,
            output: null,
            errors: [
                "The quantifier 'a+' can exchange characters with 'a+'. Using any string accepted by /a+/, this can be exploited to cause at least polynomial backtracking. This might cause exponential backtracking.",
            ],
        },

        // trade
        {
            code: String.raw`/\ba+a+$/`,
            output: String.raw`/\ba{2,}$/`,
            errors: [
                "The quantifier 'a+' can exchange characters with 'a+'. Using any string accepted by /a+/, this can be exploited to cause at least polynomial backtracking. This might cause exponential backtracking.",
            ],
        },
        {
            code: String.raw`/\b\w+a\w+$/`,
            output: String.raw`/\b\w[\dA-Z_b-z]*a\w+$/`,
            errors: [
                "The quantifier '\\w+' can exchange characters with '\\w+'. Using any string accepted by /a+/, this can be exploited to cause at least polynomial backtracking. This might cause exponential backtracking.",
            ],
        },
        {
            code: String.raw`/\b\w+a?b{4}\w+$/`,
            output: null,
            errors: [
                "The quantifier '\\w+' can exchange characters with '\\w+'. Using any string accepted by /b+/, this can be exploited to cause at least polynomial backtracking. This might cause exponential backtracking.",
            ],
        },
        {
            code: String.raw`/[\q{a}]*b?[\q{a}]+$/v`,
            output: String.raw`/(?:[\q{a}]+(?:b[\q{a}]+)?|b[\q{a}]+)$/v`,
            errors: [
                "The quantifier '[\\q{a}]*' can exchange characters with '[\\q{a}]+'. Using any string accepted by /a+/, this can be exploited to cause at least polynomial backtracking. This might cause exponential backtracking.",
            ],
        },
    ],
})
