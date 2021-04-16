import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-potentially-empty-backreference"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-potentially-empty-backreference", rule as any, {
    valid: [
        String.raw`/()\1/`,
        String.raw`/(a*)(?:a|\1)/`,
        String.raw`/(a)+\1/`,
        String.raw`/(?=(a))\1/`,

        // done by regexp/no-useless-backreference
        String.raw`/(a+)b|\1/`,
    ],
    invalid: [
        {
            code: String.raw`
            /* ✓ GOOD */
            var foo = /(a+)b\1/;
            var foo = /(a+)b|\1/;  // this will be done by regexp/no-useless-backreference


            /* ✗ BAD */
            var foo = /(a)?b\1/;
            var foo = /((a)|c)+b\2/;`,
            errors: [
                {
                    message:
                        "Some path leading to the backreference do not go through the referenced capturing group without resetting its text.",
                    line: 8,
                    column: 29,
                },
                {
                    message:
                        "Some path leading to the backreference do not go through the referenced capturing group without resetting its text.",
                    line: 9,
                    column: 33,
                },
            ],
        },
        {
            code: String.raw`/(a)?\1/`,
            errors: [
                {
                    message:
                        "Some path leading to the backreference do not go through the referenced capturing group without resetting its text.",
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
                        "Some path leading to the backreference do not go through the referenced capturing group without resetting its text.",
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
                        "Some path leading to the backreference do not go through the referenced capturing group without resetting its text.",
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
                        "Some path leading to the backreference do not go through the referenced capturing group without resetting its text.",
                    line: 1,
                    column: 12,
                },
            ],
        },
    ],
})
