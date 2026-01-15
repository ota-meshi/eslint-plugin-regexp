import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-useless-string-literal.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-string-literal", rule as any, {
    valid: [String.raw`/[\q{abc}]/v`, String.raw`/[\q{ab|}]/v`],
    invalid: [
        String.raw`/[\q{a}]/v`,
        String.raw`/[\q{a|bc}]/v`,
        String.raw`/[\q{ab|c}]/v`,
        String.raw`/[\q{ab|c|de}]/v`,
        String.raw`/[a\q{ab|\-}]/v`,
        String.raw`/[\q{ab|^}]/v`,
        String.raw`/[\q{ab|c}&&\q{ab}]/v`,
        String.raw`/[A&&\q{&}]/v`,
        String.raw`/[\q{&}&&A]/v`,
        String.raw`/[A&&\q{^|ab}]/v`,
    ],
})
