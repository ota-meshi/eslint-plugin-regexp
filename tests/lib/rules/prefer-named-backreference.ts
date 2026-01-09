import { ESLint } from "eslint"
import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import semver from "semver"
import rule from "../../../lib/rules/prefer-named-backreference"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-named-backreference", rule as any, {
    valid: [
        String.raw`/(a)\1/`,
        String.raw`/(?<foo>a)\k<foo>/`,
        String.raw`/(a)\1 (?<foo>a)\k<foo>/`,
        // ES2025
        ...(semver.gte(ESLint.version, "9.6.0")
            ? [String.raw`/((?<foo>a)|(?<foo>b))\1/`]
            : []),
    ],
    invalid: [String.raw`/(?<foo>a)\1/`, String.raw`/(?<foo>a)\1/v`],
})
