import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-useless-quantifier.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-quantifier", rule as any, {
    valid: [
        "/a*/",
        "/(?:a)?/",
        "/(?:a|b?)??/",
        String.raw`/(?:\b|a)?/`,
        String.raw`/(?:\b)*/`,
        String.raw`/(?:\b|(?!a))*/`,
        String.raw`/(?:\b|(?!))*/`,
        String.raw`/#[\da-z]+|#(?:-|([+/\\*~<>=@%|&?!])\1?)|#(?=\()/`,
    ],
    invalid: [
        // trivial
        "/a{1}/",
        "/a{1,1}?/",

        // empty quantified element
        "/(?:)+/",
        String.raw`/(?:[\q{}])+/v`,
        "/(?:|(?:)){5,9}/",
        "/(?:|()()())*/",

        // unnecessary optional quantifier (?) because the quantified element is potentially empty
        "/(?:a+b*|c*)?/",
        "/(?:a|b?c?d?e?f?)?/",

        // quantified elements which do not consume characters
        String.raw`/(?:\b)+/`,
        String.raw`/(?:\b){5,100}/`,
        String.raw`/(?:\b|(?!a))+/`,
        String.raw`/(?:\b|(?!)){6}/`,
    ],
})
