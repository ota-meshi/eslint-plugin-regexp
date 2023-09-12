import { RuleTester } from "eslint"
import rule from "../../../lib/rules/require-reduce-negation"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("require-reduce-negation", rule as any, {
    valid: [
        String.raw`/[[abc]]/v`,
        String.raw`/[\d]/u`,
        String.raw`/[^\d]/v`, // Converting to `\D` does not reduce negation, so ignore it. The `negation` rule handles it.
        String.raw`/[a--b]/v`,
        String.raw`/[a&&b]/v`,
        String.raw`/[^ab]/v`,
        String.raw`/[^a&&b]/v;`,
        String.raw`/[\s\p{ASCII}]/u`,
        String.raw`/[^\S\P{ASCII}]/u`,
        String.raw`/[^[]]/v`,
        String.raw`/[a&&b&&[c]]/v`,
        String.raw`/[a--b--[c]]/v`,
    ],
    invalid: [
        {
            code: String.raw`/[^[^abc]]/v`,
            output: String.raw`/[abc]/v`,
            errors: [
                "This character class can be double negation elimination.",
            ],
        },
        {
            code: String.raw`/[^\D]/u`,
            output: String.raw`/[\d]/u`,
            errors: [
                "This character class can be double negation elimination.",
            ],
        },
        {
            code: String.raw`/[^\P{ASCII}]/u`,
            output: String.raw`/[\p{ASCII}]/u`,
            errors: [
                "This character class can be double negation elimination.",
            ],
        },
        {
            code: String.raw`/[^[^\q{a|1|A}&&\w]]/v`,
            output: String.raw`/[[\q{a|1|A}&&\w]]/v`,
            errors: [
                "This character class can be double negation elimination.",
            ],
        },
        {
            code: String.raw`/[a&&[^b]]/v`,
            output: String.raw`/[a--b]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[a&&b&&[^c]]/v`,
            output: String.raw`/[[a&&b]--c]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[a&&[^b]&&c]/v`,
            output: String.raw`/[[a&&c]--b]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[a&&b&&[^c]&&d]/v`,
            output: String.raw`/[[a&&b&&d]--c]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[[^a]&&b&&c]/v`,
            output: String.raw`/[[b&&c]--a]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[[^b]&&a]/v`,
            output: String.raw`/[a--b]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[[abc]&&[^def]]/v`,
            output: String.raw`/[[abc]--[def]]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[a--[^b]]/v`,
            output: String.raw`/[a&&b]/v`,
            errors: ["This expression can be converted to the intersection."],
        },
        {
            code: String.raw`/[a--[^b]--c]/v`,
            output: String.raw`/[[a&&b]--c]/v`,
            errors: ["This expression can be converted to the intersection."],
        },
        {
            code: String.raw`/[a--b--[^c]]/v`,
            output: String.raw`/[[a--b]&&c]/v`,
            errors: ["This expression can be converted to the intersection."],
        },
        {
            code: String.raw`/[[abc]--[^def]]/v`,
            output: String.raw`/[[abc]&&[def]]/v`,
            errors: ["This expression can be converted to the intersection."],
        },
        {
            code: String.raw`/[[^a]&&[^b]]/v`,
            output: String.raw`/[^ab]/v`,
            errors: [
                "This character class can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[^[^a]&&[^b]]/v`,
            output: String.raw`/[ab]/v`,
            errors: [
                "This character class can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[[^a]&&[^b]&&\D]/v`,
            output: String.raw`/[^ab\d]/v`,
            errors: [
                "This character class can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[^[^a]&&[^b]&&\D]/v`,
            output: String.raw`/[ab\d]/v`,
            errors: [
                "This character class can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[[^a]&&\D&&b]/v`,
            output: String.raw`/[[^a\d]&&b]/v`,
            errors: [
                "This expression can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[[^abc]&&[^def]&&\D]/v`,
            output: String.raw`/[^abcdef\d]/v`,
            errors: [
                "This character class can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[[^a]&&[b]&&[^c]]/v`,
            output: String.raw`/[[^ac]&&[b]]/v`,
            errors: [
                "This expression can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[[^a][^b]]/v`,
            output: String.raw`/[^a&&b]/v`,
            errors: [
                "This character class can be converted to the negation of a conjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[[^abc][^def]]/v`,
            output: String.raw`/[^[abc]&&[def]]/v`,
            errors: [
                "This character class can be converted to the negation of a conjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[^[^a][^b]]/v`,
            output: String.raw`/[a&&b]/v`,
            errors: [
                "This character class can be converted to the negation of a conjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[^\S\P{ASCII}]/v`,
            output: String.raw`/[\s&&\p{ASCII}]/v`,
            errors: [
                "This character class can be converted to the negation of a conjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[a&&[^b]&&[^c]&&d]/v`,
            output: String.raw`/[[^bc]&&a&&d]/v`,
            errors: [
                "This expression can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[[^bc]&&a&&d]/v`,
            output: String.raw`/[[a&&d]--[bc]]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
    ],
})
