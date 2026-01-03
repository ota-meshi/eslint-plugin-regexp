import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/optimal-lookaround-quantifier.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("optimal-lookaround-quantifier", rule as any, {
    valid: [String.raw`/(?=(a*))\w+\1/`, `/(?<=a{4})/`, `/(?=a(?:(a)|b)*)/`],
    invalid: [
        `/(?=ba*)/`,
        `/(?=ba*)/v`,
        `/(?=(?:a|b|abc*))/`,
        `/(?=(?:a|b|abc+))/`,
        `/(?=(?:a|b|abc{4,9}))/`,
        `/(?<=[a-c]*)/`,
        `/(?<=(?:d|c)*ab)/`,
    ],
})
