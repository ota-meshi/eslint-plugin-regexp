import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-super-linear-backtracking.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-super-linear-backtracking", rule as any, {
    valid: [
        String.raw`/regexp/`,
        String.raw`/a+b+a+b+/`,
        String.raw`/\w+\b[\w-]+/`,
        String.raw`/[\q{ab}]*[\q{ab}]*$/v`, // Limitation of scslre
    ],
    invalid: [
        // self
        String.raw`/b(?:a+)+b/`,
        String.raw`/(?:ba+|a+b){2}/`,

        // trade
        String.raw`/\ba+a+$/`,
        String.raw`/\b\w+a\w+$/`,
        String.raw`/\b\w+a?b{4}\w+$/`,
        String.raw`/[\q{a}]*b?[\q{a}]+$/v`,
    ],
})
