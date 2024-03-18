import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-star-quantifier"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-star-quantifier", rule as any, {
    valid: ["/a*/", "/a*?/", "/(a*)/", "/(a*?)/", "/[a{0,}]/", "/a{0,10}/"],
    invalid: [
        "/a{0,}/",
        "/a{0,}?/",
        "/(a){0,}/",
        "/(a){0,}/v",
        "/(a){0,}?/",
        `
            const s = "a{0,}"
            new RegExp(s)
            `,
        `
            const s = "a{0"+",}"
            new RegExp(s)
            `,
    ],
})
