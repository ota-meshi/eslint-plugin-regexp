import { RuleTester } from "eslint"
import rule from "../../../lib/rules/use-ignore-case"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("use-ignore-case", rule as any, {
    valid: [
        String.raw`/regexp/`,
        String.raw`/[aA]/i`,
        String.raw`/[aA]a/`,
        String.raw`/[aAb]/`,
        String.raw`/[aaaa]/`,

        // partial pattern
        String.raw`/[a-zA-Z]/.source`,
    ],
    invalid: [
        {
            code: String.raw`/[a-zA-Z]/`,
            output: String.raw`/[a-z]/i`,
            errors: [
                "The character class(es) '[a-zA-Z]' can be simplified using the `i` flag.",
            ],
        },
        {
            code: String.raw`/\b0[xX][a-fA-F0-9]+\b/`,
            output: String.raw`/\b0[x][a-f0-9]+\b/i`,
            errors: [
                "The character class(es) '[xX]', '[a-fA-F0-9]' can be simplified using the `i` flag.",
            ],
        },
        {
            code: String.raw`RegExp("[a-zA-Z]")`,
            output: String.raw`RegExp("[a-z]", "i")`,
            errors: [
                "The character class(es) '[a-zA-Z]' can be simplified using the `i` flag.",
            ],
        },
    ],
})
