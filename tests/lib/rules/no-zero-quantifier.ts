import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-zero-quantifier"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-zero-quantifier", rule as any, {
    valid: [`/a{0,1}/`, `/a{0,}/`],
    invalid: [`/a{0}/`, `/a{0}/v`, `/a{0,0}/`, `/a{0,0}?b/`, `/(a){0}/`],
})
