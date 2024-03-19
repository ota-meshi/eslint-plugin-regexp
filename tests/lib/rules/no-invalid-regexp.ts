import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-invalid-regexp"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-invalid-regexp", rule as any, {
    valid: [`/regexp/`, `RegExp("(" + ")")`],
    invalid: [
        `RegExp("(")`,
        `RegExp("(" + "(")`,
        `RegExp("[a-Z] some valid stuff")`,

        "new RegExp(pattern, 'uu');",
        "new RegExp(pattern, 'uv');",
        "new RegExp('[A&&&]', 'v');",
    ],
})
