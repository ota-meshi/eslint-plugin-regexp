import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-empty-character-class"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-empty-character-class", rule as any, {
    valid: [
        `/[a]/`,
        `/[a-z]/`,
        `/[a]?/`,
        `/[a]*/`,
        `/[[]/`,
        String.raw`/\[]/`,
        `/[^]/`,
        `/[()]/`,
        `/[ ]/`,
    ],
    invalid: [
        {
            code: `/[]/`,
            errors: [
                {
                    message: "Unexpected empty character class.",
                    line: 1,
                    column: 2,
                },
            ],
        },
        {
            code: `/abc[]/`,
            errors: [
                {
                    message: "Unexpected empty character class.",
                    line: 1,
                    column: 5,
                },
            ],
        },
        {
            code: `/([])/`,
            errors: [
                {
                    message: "Unexpected empty character class.",
                    line: 1,
                    column: 3,
                },
            ],
        },
        {
            code: `new RegExp("[]");`,
            errors: [
                {
                    message: "Unexpected empty character class.",
                    line: 1,
                    column: 13,
                },
            ],
        },
    ],
})
