import { RuleTester } from "eslint"
import rule from "../../../lib/rules/use-ignore-case"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
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

        String.raw`/regexp/u`,
        String.raw`/[aA]/iu`,
        String.raw`/[aA]a/u`,
        String.raw`/[aAb]/u`,
        String.raw`/[aaaa]/u`,
        String.raw`/\b[aA]/u`,
        String.raw`/[a-zA-Z]/u`,

        String.raw`/regexp/v`,
        String.raw`/[aA]/iv`,
        String.raw`/[aA]a/v`,
        String.raw`/[aAb]/v`,
        String.raw`/[aaaa]/v`,
        String.raw`/\b[aA]/v`,
        String.raw`/[a-zA-Z]/v`,

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
            code: String.raw`/[aA][aA][aA][aA][aA]/`,
            output: String.raw`/[a][a][a][a][a]/i`,
            errors: [
                "The character class(es) '[aA]', '[aA]', '[aA]', '[aA]', '[aA]' can be simplified using the `i` flag.",
            ],
        },
        {
            code: String.raw`/[aA]/u`,
            output: String.raw`/[a]/iu`,
            errors: [
                "The character class(es) '[aA]' can be simplified using the `i` flag.",
            ],
        },
        {
            code: String.raw`/[aA]/v`,
            output: String.raw`/[a]/iv`,
            errors: [
                "The character class(es) '[aA]' can be simplified using the `i` flag.",
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
        {
            code: String.raw`/[\q{a|A}]/v`,
            output: String.raw`/[\q{a}]/iv`,
            errors: [
                "The character class(es) '[\\q{a|A}]' can be simplified using the `i` flag.",
            ],
        },
    ],
})
