import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-empty-capturing-group"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-empty-capturing-group", rule as any, {
    valid: ["/(a)/", "/a(\\bb)/", "/a(\\b|b)/", String.raw`/a([\q{a}])/v`],
    invalid: [
        "/a(\\b)/",
        "/a($)/",
        "/(^)a/",
        "/()a/",
        "/(\\b\\b|(?:\\B|$))a/",
        String.raw`/a([\q{}])/v`,
    ],
})
