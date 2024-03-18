import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-useless-set-operand"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-set-operand", rule as any, {
    valid: [String.raw`/[\w--\d]/v`],
    invalid: [
        String.raw`/[\w&&\d]/v`,
        String.raw`/[\w&&\s]/v`,
        String.raw`/[^\w&&\s]/v`,
        String.raw`/[\w&&[\d\s]]/v`,
        String.raw`/[\w&&[^\d\s]]/v`,
        String.raw`/[\w--\s]/v`,
        String.raw`/[\d--\w]/v`,
        String.raw`/[^\d--\w]/v`,
        String.raw`/[\w--[\d\s]]/v`,
        String.raw`/[\w--[^\d\s]]/v`,
        String.raw`/[\w--[a\q{aa|b}]]/v`,
        String.raw`/[\w--[a\q{aa}]]/v`,
        String.raw`/[\w--\q{a|aa}]/v`,
    ],
})
