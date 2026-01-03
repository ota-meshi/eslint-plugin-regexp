import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-trivially-nested-assertion.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-trivially-nested-assertion", rule as any, {
    valid: [
        `/(?=(?=a)b)/`,

        // these anchors cannot be negated, so they have to be allowed
        `/(?!$)/`,
        `/(?<!$)/`,
        `/(?!^)/`,
        `/(?<!^)/`,

        // the text of capturing groups inside negated lookarounds is
        // guaranteed to be reset, so we can't transform them into one
        // non-negated lookaround
        `/(?!(?!(a)))/`,

        // ES2024
        String.raw`/(?=[\q{$}])/v`,
    ],
    invalid: [
        String(/(?=$)/),
        String(/(?=^)/),
        String(/(?<=$)/),
        String(/(?<=^)/),
        String(/(?=\b)/),
        String(/(?!\b)/),
        String(/(?<=\b)/),
        String(/(?<!\b)/),

        // all trivially nested lookarounds can be written as one lookaround
        // Note: The inner lookaround has to be negated if the outer one is negative.
        String(/(?=(?=a))/),
        String(/(?=(?!a))/),
        String(/(?=(?<=a))/),
        String(/(?=(?<!a))/),
        String(/(?!(?=a))/),
        String(/(?!(?!a))/),
        String(/(?!(?<=a))/),
        String(/(?!(?<!a))/),
        String(/(?<=(?=a))/),
        String(/(?<=(?!a))/),
        String(/(?<=(?<=a))/),
        String(/(?<=(?<!a))/),
        String(/(?<!(?=a))/),
        String(/(?<!(?!a))/),
        String(/(?<!(?<=a))/),
        String(/(?<!(?<!a))/),
    ],
})
