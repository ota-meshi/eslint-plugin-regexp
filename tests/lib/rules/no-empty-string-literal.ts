import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-empty-string-literal.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-empty-string-literal", rule as any, {
    valid: [
        String.raw`/[\q{a}]/v`,
        String.raw`/[\q{abc}]/v`,
        String.raw`/[\q{a|}]/v`,
        String.raw`/[\q{abc|}]/v`,
        String.raw`/[\q{|a}]/v`,
        String.raw`/[\q{|abc}]/v`,
    ],
    invalid: [String.raw`/[\q{}]/v`, String.raw`/[\q{|}]/v`],
})
