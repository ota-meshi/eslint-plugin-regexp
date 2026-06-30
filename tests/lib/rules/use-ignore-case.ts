import { ESLint } from "eslint"
import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import semver from "semver"
import rule from "../../../lib/rules/use-ignore-case.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("use-ignore-case", rule as any, {
    valid: [
        "/regexp/",
        "/[aA]/i",
        "/[aA]a/",
        "/[aAb]/",
        "/[aaaa]/",

        "/regexp/u",
        "/[aA]/iu",
        "/[aA]a/u",
        "/[aAb]/u",
        "/[aaaa]/u",
        String.raw`/\b[aA]/u`,
        "/[a-zA-Z]/u",

        "/regexp/v",
        "/[aA]/iv",
        "/[aA]a/v",
        "/[aAb]/v",
        "/[aaaa]/v",
        String.raw`/\b[aA]/v`,
        "/[a-zA-Z]/v",

        // partial pattern
        "/[a-zA-Z]/.source",
    ],
    invalid: [
        "/[a-zA-Z]/",
        "/[aA][aA][aA][aA][aA]/",
        "/[aA]/u",
        "/[aA]/v",
        String.raw`/\b0[xX][a-fA-F0-9]+\b/`,
        'RegExp("[a-zA-Z]")',
        String.raw`/[\q{a|A}]/v`,
        // ES2025
        ...(semver.gte(ESLint.version, "9.6.0")
            ? [String.raw`/(?:(?<foo>[aA])|(?<foo>[bB]))\k<foo>/`]
            : []),
    ],
})
