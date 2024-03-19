import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-useless-quantifier"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-quantifier", rule as any, {
    valid: [
        String.raw`/a*/`,
        String.raw`/(?:a)?/`,
        String.raw`/(?:a|b?)??/`,
        String.raw`/(?:\b|a)?/`,
        String.raw`/(?:\b)*/`,
        String.raw`/(?:\b|(?!a))*/`,
        String.raw`/(?:\b|(?!))*/`,
        String.raw`/#[\da-z]+|#(?:-|([+/\\*~<>=@%|&?!])\1?)|#(?=\()/`,
    ],
    invalid: [
        // trivial
        String.raw`/a{1}/`,
        String.raw`/a{1,1}?/`,

        // empty quantified element
        String.raw`/(?:)+/`,
        String.raw`/(?:[\q{}])+/v`,
        String.raw`/(?:|(?:)){5,9}/`,
        String.raw`/(?:|()()())*/`,

        // unnecessary optional quantifier (?) because the quantified element is potentially empty
        String.raw`/(?:a+b*|c*)?/`,
        String.raw`/(?:a|b?c?d?e?f?)?/`,

        // quantified elements which do not consume characters
        String.raw`/(?:\b)+/`,
        String.raw`/(?:\b){5,100}/`,
        String.raw`/(?:\b|(?!a))+/`,
        String.raw`/(?:\b|(?!)){6}/`,
    ],
})
