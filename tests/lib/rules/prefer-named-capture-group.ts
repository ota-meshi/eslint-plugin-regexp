import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-named-capture-group"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-named-capture-group", rule as any, {
    valid: [
        String.raw`/foo/`,
        String.raw`/b(?:a(?:r))/`,
        String.raw`/(?<foo>bar)/`,
        String.raw`/(?=a)(?<=b)/`,
    ],
    invalid: [String.raw`/(foo)/`, String.raw`/(foo)/v`],
})
