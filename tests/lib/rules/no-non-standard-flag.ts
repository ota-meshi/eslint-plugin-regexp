import * as tsParser from "@typescript-eslint/parser"
import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-non-standard-flag.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-non-standard-flag", rule as any, {
    valid: [`/foo/gimsuy`, `/foo/v`],
    invalid: [
        `/fo*o*/l`,
        `RegExp("foo", "l")`,

        // unknown pattern
        `RegExp(someVariable, "l")`,
        // invalid pattern
        `RegExp("(", "l")`,
    ],
})
