import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/simplify-set-operations"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("simplify-set-operations", rule as any, {
    valid: [
        String.raw`/[[abc]]/v`,
        String.raw`/[\d]/u`,
        String.raw`/[^\d]/v`,
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
            code: String.raw`/[a&&[^b]]/v`,
            output: String.raw`/[a--[b]]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[a&&b&&[^c]]/v`,
            output: String.raw`/[[a&&b]--[c]]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[a&&[^b]&&c]/v`,
            output: String.raw`/[[a&&c]--[b]]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[a&&b&&[^c]&&d]/v`,
            output: String.raw`/[[a&&b&&d]--[c]]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[[^a]&&b&&c]/v`,
            output: String.raw`/[[b&&c]--[a]]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[[^b]&&a]/v`,
            output: String.raw`/[a--[b]]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[[abc]&&[^def]]/v`,
            output: String.raw`/[[abc]--[def]]/v`,
            errors: ["This expression can be converted to the subtraction."],
        },
        {
            code: String.raw`/[a--[^b]]/v`,
            output: String.raw`/[a&&[b]]/v`,
            errors: ["This expression can be converted to the intersection."],
        },
        {
            code: String.raw`/[a--[^b]--c]/v`,
            output: String.raw`/[[a&&[b]]--c]/v`,
            errors: ["This expression can be converted to the intersection."],
        },
        {
            code: String.raw`/[a--b--[^c]]/v`,
            output: String.raw`/[[a--b]&&[c]]/v`,
            errors: ["This expression can be converted to the intersection."],
        },
        {
            code: String.raw`/[[abc]--[^def]]/v`,
            output: String.raw`/[[abc]&&[def]]/v`,
            errors: ["This expression can be converted to the intersection."],
        },
        {
            code: String.raw`/[[^a]&&[^b]]/v`,
            output: String.raw`/[^[a][b]]/v`,
            errors: [
                "This character class can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[^[^a]&&[^b]]/v`,
            output: String.raw`/[[a][b]]/v`,
            errors: [
                "This character class can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[[^a]&&[^b]&&\D]/v`,
            output: String.raw`/[^[a][b]\d]/v`,
            errors: [
                "This character class can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[^[^a]&&[^b]&&\D]/v`,
            output: String.raw`/[[a][b]\d]/v`,
            errors: [
                "This character class can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[[^a]&&\D&&b]/v`,
            output: String.raw`/[[^[a]\d]&&b]/v`,
            errors: [
                "This expression can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[[^abc]&&[^def]&&\D]/v`,
            output: String.raw`/[^[abc][def]\d]/v`,
            errors: [
                "This character class can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[[^a]&&[b]&&[^c]]/v`,
            output: String.raw`/[[^[a][c]]&&[b]]/v`,
            errors: [
                "This expression can be converted to the negation of a disjunction using De Morgan's laws.",
            ],
        },
        {
            code: String.raw`/[[^a][^b]]/v`,
            output: String.raw`/[^[a]&&[b]]/v`,
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
            output: String.raw`/[[a]&&[b]]/v`,
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
            output: String.raw`/[[^[b][c]]&&a&&d]/v`,
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
