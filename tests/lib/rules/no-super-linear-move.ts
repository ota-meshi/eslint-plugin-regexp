import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-super-linear-move"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-super-linear-move", rule as any, {
    valid: [
        String.raw`/regexp/`,
        String.raw`/\ba*:/`,

        // no rejecting suffix
        String.raw`/a*/`,
    ],
    invalid: [
        {
            code: String.raw`/a*:/`,
            errors: [
                "Any attack string /a+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.",
            ],
        },
        {
            code: String.raw`/^\s*(\w+)\s*[:=]/m`,
            errors: [
                "Any attack string /[\\n\\r\\u2028\\u2029]+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.",
            ],
        },
        {
            code: String.raw`/((?:\\{2})*)(\\?)\|/g`,
            errors: [
                "Any attack string /(?:\\\\{2})+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.",
            ],
        },
        {
            code: String.raw`/[a-z_][A-Z_0-9]*(?=\s*\()/i`,
            errors: [
                "Any attack string /[A-Z_]+/i plus some rejecting suffix will cause quadratic runtime because of this quantifier.",
            ],
        },
        {
            code: String.raw`/(?!\d)\w+(?=\s*\()/i`,
            errors: [
                "Any attack string /[A-Z_]+/i plus some rejecting suffix will cause quadratic runtime because of this quantifier.",
            ],
        },
    ],
})
