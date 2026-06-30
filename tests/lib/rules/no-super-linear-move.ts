import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-super-linear-move.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-super-linear-move", rule as any, {
    valid: [
        "/regexp/",
        String.raw`/\ba*:/`,

        // no rejecting suffix
        "/a*/",

        {
            code: "/a*/.test(input)",
            options: [{ report: "potential" }],
        },
        {
            code: "export default /a*/",
            options: [{ report: "certain" }],
        },
        { code: "/a*b/.source", options: [{ ignorePartial: true }] },
        { code: "/a*b/y", options: [{ ignoreSticky: true }] },
        String.raw`/[\q{abc}]+/v`,
    ],
    invalid: [
        "/a*:/",
        String.raw`/^\s*(\w+)\s*[:=]/m`,
        String.raw`/((?:\\{2})*)(\\?)\|/g`,
        String.raw`/[a-z_][A-Z_0-9]*(?=\s*\()/i`,
        String.raw`/(?!\d)\w+(?=\s*\()/i`,

        {
            code: "export default /a*/",
            options: [{ report: "potential" }],
        },
        {
            code: "/a*b/.source",
            options: [{ ignorePartial: false }],
        },
        {
            code: "/a*b/y",
            options: [{ ignoreSticky: false }],
        },
        String.raw`/[\q{abc}]+a/v`,
    ],
})
