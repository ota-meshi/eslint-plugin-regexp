import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-contradiction-with-assertion.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-contradiction-with-assertion", rule as any, {
    valid: [
        // Ignore trivially accepting/rejecting assertions
        String.raw`/a\ba/`,
        String.raw`/(?!)a/`,
        String.raw`/(?=)a/`,
        String.raw`/$a/`,
        String.raw`/$a/v`,

        // Other valid regexes
        String.raw`/(^|[\s\S])\bfoo/`,
        String.raw`/(?:aa|a\b)-?a/`,
        String.raw`/(?:aa|a\b)-?a/v`,
    ],
    invalid: [
        String.raw`/a\b-?a/`,
        String.raw`/a\b(a|-)/`,
        String.raw`/a\ba*-/`,
        String.raw`/a\b[a\q{foo|bar}]*-/v`,

        String.raw`/(^[\t ]*)#(?:comments-start|cs)[\s\S]*?^[ \t]*#(?:comments-end|ce)/m`,
    ],
})
