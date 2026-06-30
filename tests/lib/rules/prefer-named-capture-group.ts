import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-named-capture-group.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-named-capture-group", rule as any, {
    valid: ["/foo/", "/b(?:a(?:r))/", "/(?<foo>bar)/", "/(?=a)(?<=b)/"],
    invalid: ["/(foo)/", "/(foo)/v"],
})
