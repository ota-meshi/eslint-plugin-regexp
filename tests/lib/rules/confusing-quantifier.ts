import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/confusing-quantifier.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("confusing-quantifier", rule as any, {
    valid: [
        String.raw`/a+/`,
        String.raw`/a?/`,
        String.raw`/(a|b?)*/`,
        String.raw`/(a?){0,3}/`,
        String.raw`/(a|\b)+/`,
        String.raw`/[\q{a|b}]+/v`,
    ],
    invalid: [
        String.raw`/(a?){5}/`,
        String.raw`/(?:a?b*|c+){4}/`,
        String.raw`/[\q{a|}]+/v`,
    ],
})
