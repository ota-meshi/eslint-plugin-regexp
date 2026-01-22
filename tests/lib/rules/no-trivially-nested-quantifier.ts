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
        String.raw`/(?:a?)+/`,
        String.raw`/(?:a{1,2})*/`,
        String.raw`/(?:a{1,2})+/`,
        String.raw`/(?:a{1,2}){3,4}/`,
        String.raw`/(?:a{2,}){4}/`,
        String.raw`/(?:a{4,}){5}/`,
        String.raw`/(?:a{3}){4}/`,
        String.raw`/(?:a+|b)*/`,
        String.raw`/(?:a?|b)*/`,
        String.raw`/(?:a{0,4}|b)*/`,
        String.raw`/(?:a{0,4}|b)+/`,
        String.raw`/(?:a{0,4}?|b)+?/`,
        String.raw`/(?:[\q{a}]+)+/v`,
    ],
})
