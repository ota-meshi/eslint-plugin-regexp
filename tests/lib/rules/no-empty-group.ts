import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-empty-group"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-empty-group", rule as any, {
    valid: ["/(a)/", "/(a|)/", "/(?:a|)/", String.raw`/(?:a|[\q{}])/v`],
    invalid: ["/()/", "/(?:)/", "/(|)/", "/(?:|)/"],
})
