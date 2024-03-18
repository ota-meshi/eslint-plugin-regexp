import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-plus-quantifier"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-plus-quantifier", rule as any, {
    valid: ["/a+/", "/a+?/", "/(a+)/", "/(a+?)/", "/[a{1,}]/", "/a{1,2}/"],
    invalid: [
        "/a{1,}/",
        "/a{1,}?/",
        "/(a){1,}/",
        "/(a){1,}/v",
        "/(a){1,}?/",
        `
            const s = "a{1,}"
            new RegExp(s)
            `,
        `
            const s = "a{1"+",}"
            new RegExp(s)
            `,
    ],
})
