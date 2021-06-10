import { RuleTester } from "eslint"
import rule from "../../../lib/rules/order-in-character-class"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("order-in-character-class", rule as any, {
    valid: [`/[abcd]/`],
    invalid: [
        {
            code: `/[acdb]/`,
            output: `/[abcd]/`,
            errors: [
                "Expected character class elements to be in ascending order. 'b' should be before 'c'.",
            ],
        },
    ],
})
