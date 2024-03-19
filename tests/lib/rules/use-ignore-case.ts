import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/use-ignore-case"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("use-ignore-case", rule as any, {
    valid: [
        String.raw`/regexp/`,
        String.raw`/[aA]/i`,
        String.raw`/[aA]a/`,
        String.raw`/[aAb]/`,
        String.raw`/[aaaa]/`,

        String.raw`/regexp/u`,
        String.raw`/[aA]/iu`,
        String.raw`/[aA]a/u`,
        String.raw`/[aAb]/u`,
        String.raw`/[aaaa]/u`,
        String.raw`/\b[aA]/u`,
        String.raw`/[a-zA-Z]/u`,

        String.raw`/regexp/v`,
        String.raw`/[aA]/iv`,
        String.raw`/[aA]a/v`,
        String.raw`/[aAb]/v`,
        String.raw`/[aaaa]/v`,
        String.raw`/\b[aA]/v`,
        String.raw`/[a-zA-Z]/v`,

        // partial pattern
        String.raw`/[a-zA-Z]/.source`,
    ],
    invalid: [
        String.raw`/[a-zA-Z]/`,
        String.raw`/[aA][aA][aA][aA][aA]/`,
        String.raw`/[aA]/u`,
        String.raw`/[aA]/v`,
        String.raw`/\b0[xX][a-fA-F0-9]+\b/`,
        String.raw`RegExp("[a-zA-Z]")`,
        String.raw`/[\q{a|A}]/v`,
    ],
})
