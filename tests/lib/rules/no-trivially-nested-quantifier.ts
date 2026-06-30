import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-trivially-nested-quantifier.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-trivially-nested-quantifier", rule as any, {
    valid: [
        `/(a?)+/`,
        `/(?:a{2})+/`,
        `/(?:a{3,4})+/`,
        `/(?:a+?)+/`,
        String.raw`/(?:[\q{a}])+/v`,
    ],
    invalid: [
        "/(?:a?)+/",
        "/(?:a{1,2})*/",
        "/(?:a{1,2})+/",
        "/(?:a{1,2}){3,4}/",
        "/(?:a{2,}){4}/",
        "/(?:a{4,}){5}/",
        "/(?:a{3}){4}/",
        "/(?:a+|b)*/",
        "/(?:a?|b)*/",
        "/(?:a{0,4}|b)*/",
        "/(?:a{0,4}|b)+/",
        "/(?:a{0,4}?|b)+?/",
        String.raw`/(?:[\q{a}]+)+/v`,
    ],
})
