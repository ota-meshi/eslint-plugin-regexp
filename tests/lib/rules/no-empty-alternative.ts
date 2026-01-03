import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-empty-alternative.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-empty-alternative", rule as any, {
    valid: [`/()|(?:)|(?=)/`, `/(?:)/`, `/a*|b+/`, String.raw`/[\q{a|b}]/v`],
    invalid: [
        `/|||||/`,
        `/(a+|b+|)/`,
        String.raw`/(?:\|\|||\|)/`,
        String.raw`/(?<name>a|b|)/`,
        String.raw`/(?:a|b|)f/`,
        String.raw`/(?:a|b|)+f/`,
        String.raw`/[\q{a|}]/v`,
        String.raw`/[\q{|a}]/v`,
        String.raw`/[\q{a||b}]/v`,
    ],
})
