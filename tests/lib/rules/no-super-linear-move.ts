import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-super-linear-move"

const tester = new SnapshotRuleTester({
    languageOptions: {
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
        String.raw`/a*:/`,
        String.raw`/^\s*(\w+)\s*[:=]/m`,
        String.raw`/((?:\\{2})*)(\\?)\|/g`,
        String.raw`/[a-z_][A-Z_0-9]*(?=\s*\()/i`,
        String.raw`/(?!\d)\w+(?=\s*\()/i`,

        {
            code: String.raw`export default /a*/`,
            options: [{ report: "potential" }],
        },
        {
            code: String.raw`/a*b/.source`,
            options: [{ ignorePartial: false }],
        },
        {
            code: String.raw`/a*b/y`,
            options: [{ ignoreSticky: false }],
        },
        String.raw`/[\q{abc}]+a/v`,
    ],
})
