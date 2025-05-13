import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-empty-capturing-group"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-empty-capturing-group", rule as any, {
    valid: [
        "/(a)/",
        String.raw`/a(\bb)/`,
        String.raw`/a(\b|b)/`,
        String.raw`/a([\q{a}])/v`,
    ],
    invalid: [
        String.raw`/a(\b)/`,
        "/a($)/",
        "/(^)a/",
        "/()a/",
        String.raw`/(\b\b|(?:\B|$))a/`,
        String.raw`/a([\q{}])/v`,
    ],
})
