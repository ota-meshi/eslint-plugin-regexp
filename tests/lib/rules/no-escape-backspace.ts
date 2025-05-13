import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-escape-backspace"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-escape-backspace", rule as any, {
    valid: [
        String.raw`/\b/`,
        String.raw`/\u0008/`,
        String.raw`/\ch/`,
        String.raw`/\cH/`,
        String.raw`/[\q{\u0008}]/v`,
    ],
    invalid: [String.raw`/[\b]/`, String.raw`/[\q{\b}]/v`],
})
