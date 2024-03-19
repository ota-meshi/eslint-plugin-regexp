import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-named-backreference"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-named-backreference", rule as any, {
    valid: [`/(a)\\1/`, `/(?<foo>a)\\k<foo>/`, `/(a)\\1 (?<foo>a)\\k<foo>/`],
    invalid: [`/(?<foo>a)\\1/`, `/(?<foo>a)\\1/v`],
})
