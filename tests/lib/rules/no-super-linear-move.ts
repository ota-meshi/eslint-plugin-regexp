import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-super-linear-move"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-super-linear-move", rule as any, {
    valid: [
        String.raw`/regexp/`,
        String.raw`/\ba*:/`,

        // no rejecting suffix
        String.raw`/a*/`,

        {
            code: String.raw`/a*/.test(input)`,
            options: [{ report: "potential" }],
        },
        {
            code: String.raw`export default /a*/`,
            options: [{ report: "certain" }],
        },
        { code: String.raw`/a*b/.source`, options: [{ ignorePartial: true }] },
        { code: String.raw`/a*b/y`, options: [{ ignoreSticky: true }] },
        String.raw`/[\q{abc}]+/v`,
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

        {
            code: String.raw`export default /a*/`,
            options: [{ report: "potential" }],
            errors: [
                "Any attack string /a+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.",
            ],
        },
        {
            code: String.raw`/a*b/.source`,
            options: [{ ignorePartial: false }],
            errors: [
                "Any attack string /a+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.",
            ],
        },
        {
            code: String.raw`/a*b/y`,
            options: [{ ignoreSticky: false }],
            errors: [
                "Any attack string /a+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.",
            ],
        },
        {
            code: String.raw`/[\q{abc}]+a/v`,
            errors: [
                "Any attack string /(?:abc)+/ plus some rejecting suffix will cause quadratic runtime because of this quantifier.",
            ],
        },
    ],
})
