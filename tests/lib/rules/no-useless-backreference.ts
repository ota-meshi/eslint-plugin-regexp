import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-useless-backreference"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-backreference", rule as any, {
    valid: [
        "/.(?=(b))\\1/",
        "/(?:(a)|b)\\1/",
        "/(a)?\\1/",
        "/(a)\\1/",
        "/(?=(a))\\w\\1/",
        "/(?!(a)\\1)/",
    ],
    invalid: [
        "/(b)(\\2a)/",
        "/(a\\1)/",

        "/(\\b)a\\1/",
        "/([\\q{}])a\\1/v",
        "/(\\b|a{0})a\\1/",

        "/(a)b|\\1/",
        "/(?:(a)b|\\1)/",
        "/(?<=(a)b|\\1)/",

        "/\\1(a)/",
        "/(?:\\1(a))+/",

        "/(?<=(a)\\1)b/",

        "/(?!(a))\\w\\1/",
        "/(?!(?!(a)))\\w\\1/",
    ],
})
