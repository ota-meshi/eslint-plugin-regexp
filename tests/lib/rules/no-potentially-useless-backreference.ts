import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-potentially-useless-backreference"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-potentially-useless-backreference", rule as any, {
    valid: [
        String.raw`/()\1/`,
        String.raw`/(a*)(?:a|\1)/`,
        String.raw`/(a)+\1/`,
        String.raw`/(?=(a))\1/`,
        String.raw`/([\q{a}])\1/v`,

        // done by regexp/no-useless-backreference
        String.raw`/(a+)b|\1/`,
    ],
    invalid: [
        {
            code: String.raw`
            var foo = /(a+)b\1/;

            var foo = /(a)?b\1/;
            var foo = /((a)|c)+b\2/;`,
            errors: [
                {
                    message:
                        "Some paths leading to the backreference do not go through the referenced capturing group or the captured text might be reset before reaching the backreference.",
                    line: 4,
                    column: 29,
                },
                {
                    message:
                        "Some paths leading to the backreference do not go through the referenced capturing group or the captured text might be reset before reaching the backreference.",
                    line: 5,
                    column: 33,
                },
            ],
        },
        {
            code: String.raw`/(a)?\1/`,
            errors: [
                {
                    message:
                        "Some paths leading to the backreference do not go through the referenced capturing group or the captured text might be reset before reaching the backreference.",
                    line: 1,
                    column: 6,
                },
            ],
        },
        {
            code: String.raw`/(a)*\1/`,
            errors: [
                {
                    message:
                        "Some paths leading to the backreference do not go through the referenced capturing group or the captured text might be reset before reaching the backreference.",
                    line: 1,
                    column: 6,
                },
            ],
        },
        {
            code: String.raw`/(?:(a)|b)\1/`,
            errors: [
                {
                    message:
                        "Some paths leading to the backreference do not go through the referenced capturing group or the captured text might be reset before reaching the backreference.",
                    line: 1,
                    column: 11,
                },
            ],
        },
        {
            code: String.raw`/(?:(a)|b)+\1/`,
            errors: [
                {
                    message:
                        "Some paths leading to the backreference do not go through the referenced capturing group or the captured text might be reset before reaching the backreference.",
                    line: 1,
                    column: 12,
                },
            ],
        },
        {
            code: String.raw`/(?:([\q{a}])|b)\1/v`,
            errors: [
                {
                    message:
                        "Some paths leading to the backreference do not go through the referenced capturing group or the captured text might be reset before reaching the backreference.",
                    line: 1,
                    column: 17,
                },
            ],
        },
    ],
})
