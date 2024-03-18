import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-set-operation"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-set-operation", rule as any, {
    valid: [
        String.raw`/a\b/`,
        String.raw`/a\b/u`,
        String.raw`/a\b/v`,
        String.raw`/(?!a)\w/`,
        String.raw`/(?!a)\w/u`,
    ],
    invalid: [
        String.raw`/(?!a)\w/v`,
        String.raw`/\w(?<=\d)/v`,
        String.raw`/(?!-)&/v`,
    ],
})
