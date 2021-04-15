import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-empty-alternative"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-empty-alternative", rule as any, {
    valid: [`/()|(?:)|(?=)/`, `/(?:)/`, `/a*|b+/`],
    invalid: [
        {
            code: `/|||||/`,
            errors: [
                {
                    message: "No empty alternatives. Use quantifiers instead.",
                    line: 1,
                    column: 2,
                },
            ],
        },
        {
            code: `/(a+|b+|)/`,
            errors: [
                {
                    message: "No empty alternatives. Use quantifiers instead.",
                    line: 1,
                    column: 9,
                },
            ],
        },
        {
            code: String.raw`/(?:\|\|||\|)/`,
            errors: [
                {
                    message: "No empty alternatives. Use quantifiers instead.",
                    line: 1,
                    column: 10,
                },
            ],
        },
    ],
})
