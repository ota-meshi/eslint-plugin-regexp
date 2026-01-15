import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-standalone-backslash.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-standalone-backslash", rule as any, {
    valid: [String.raw`/\cX/`, String.raw`/[[\cA-\cZ]--\cX]/v`],
    invalid: [
        String.raw`/\c/`,
        String.raw`/\c-/`,
        String.raw`/\c1/`,
        String.raw`/[\c]/`,
    ],
})
