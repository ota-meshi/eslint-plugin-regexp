import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-question-quantifier.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-question-quantifier", rule as any, {
    valid: [
        "/a?/",
        "/a??/",
        "/(a?)/",
        "/(a??)/",
        "/[a{0,1}]/",
        "/a{0,}/",
        "/(?:a|b)/",
        "/a(?:|a)/",
        "/(?:abc||def)/",
        "/(?:)/",
        "/(?:||)/",
        "/(?:abc|def|)+/",
        "/(?:abc|def|)??/",
    ],
    invalid: [
        "/a{0,1}/",
        "/a{0,1}?/",
        "/(a){0,1}/",
        "/(a){0,1}/v",
        "/(a){0,1}?/",
        "/(?:abc|)/",
        "/(?:abc|def|)/",
        "/(?:abc||def|)/",
        "/(?:abc|def||)/",
        "/(?:abc|def|)?/",
        `
            const s = "a{0,1}"
            new RegExp(s)
            `,
        `
            const s = "a{0,"+"1}"
            new RegExp(s)
            `,
        `
            const s = "(?:abc|def|)"
            new RegExp(s)
            `,
        `
            const s = "(?:abc|"+"def|)"
            new RegExp(s)
            `,
    ],
})
