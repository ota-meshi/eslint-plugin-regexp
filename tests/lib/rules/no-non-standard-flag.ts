import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-non-standard-flag"
import * as tsParser from "@typescript-eslint/parser"

const tester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-non-standard-flag", rule as any, {
    valid: [`/foo/gimsuy`, `/foo/v`],
    invalid: [
        {
            code: `/fo*o*/l`,
            errors: [
                {
                    message: "Unexpected non-standard flag 'l'.",
                    line: 1,
                    column: 8,
                    endLine: 1,
                    endColumn: 9,
                },
            ],
        },
        {
            code: `RegExp("foo", "l")`,
            errors: [
                {
                    message: "Unexpected non-standard flag 'l'.",
                    column: 16,
                },
            ],
        },
        {
            // unknown pattern
            code: `RegExp(someVariable, "l")`,
            errors: [
                {
                    message: "Unexpected non-standard flag 'l'.",
                    column: 23,
                },
            ],
        },
        {
            // invalid pattern
            code: `RegExp("(", "l")`,
            errors: [
                {
                    message: "Unexpected non-standard flag 'l'.",
                    column: 14,
                },
            ],
        },
    ],
})
