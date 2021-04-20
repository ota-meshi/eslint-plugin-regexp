import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-non-standard-flags"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
    parser: require.resolve("@typescript-eslint/parser"),
})

tester.run("no-non-standard-flags", rule as any, {
    valid: [`/foo/gimsuy`],
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
    ],
})
