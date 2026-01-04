import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-optional-assertion.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-optional-assertion", rule as any, {
    valid: [
        String.raw`/fo(?:o\b)?/`,
        String.raw`/(?:a|(\b|-){2})?/`,
        String.raw`/(?:a|(?:\b|a)+)?/`,
        String.raw`/fo(?:o\b)/`,
        String.raw`/fo(?:o\b){1}/`,
        String.raw`/(?:(?=[\q{a}]))/v`,
    ],
    invalid: [
        String.raw`/(?:\b|(?=a))?/`,
        String.raw`/(?:\b|a)?/`,
        String.raw`/(?:^|a)*/`,
        String.raw`/(?:((?:(\b|a)))|b)?/`,
        String.raw`/(?:((?:(\b|a)))|b)*/`,
        String.raw`/((\b)+){0,}/`,
        String.raw`/(?:(?=[\q{a}]))?/v`,
    ],
})
