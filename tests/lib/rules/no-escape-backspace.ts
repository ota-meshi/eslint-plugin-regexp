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
        "/\\b/",
        "/\\u0008/",
        "/\\ch/",
        "/\\cH/",
        String.raw`/[\q{\u0008}]/v`,
    ],
    invalid: ["/[\\b]/", String.raw`/[\q{\b}]/v`],
})
