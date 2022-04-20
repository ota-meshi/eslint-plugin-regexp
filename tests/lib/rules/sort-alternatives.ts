import { RuleTester } from "eslint"
import rule from "../../../lib/rules/sort-alternatives"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("sort-alternatives", rule as any, {
    valid: [
        String.raw`/\b(?:a|\d+|c|b)\b/`,
        String.raw`/\b(?:\^|c|b)\b/`,
        String.raw`/^(?:a|ab)a/u`,
        String.raw`/^(?:a|ab)c/u`,
        String.raw`/^(?:deg|g?rad|turn)\b/`,
        String.raw`/\b(?:sample|(?:un)?stable)\b/u`,
        String.raw`/\b(?:sharpen|(?:spatial|temporal)soften)\b/u`,
        String.raw`/\b(RequestOptionsPage|x?Rec)\b/`,
        String.raw`/\b(false|[ft]|true)\b/`,
    ],
    invalid: [
        {
            code: String.raw`/c|b|a/`,
            output: String.raw`/a|b|c/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
        {
            code: String.raw`/c|bb|a/`,
            output: String.raw`/a|bb|c/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
        {
            code: String.raw`/\b(?:c|b|a)\b/`,
            output: String.raw`/\b(?:a|b|c)\b/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
        {
            code: String.raw`/\b(?:A|a|C|c|B|b)\b/`,
            output: String.raw`/\b(?:A|B|C|a|b|c)\b/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
        {
            code: String.raw`/\b(?:aa|aA|aB|ab)\b/`,
            output: String.raw`/\b(?:aA|aB|aa|ab)\b/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
        {
            code: String.raw`/\b(?:A|a|C|c|B|b)\b/i`,
            output: String.raw`/\b(?:A|a|B|b|C|c)\b/i`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
        {
            code: String.raw`/\b(?:a|A|c|C|b|B)\b/i`,
            output: String.raw`/\b(?:A|a|B|b|C|c)\b/i`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
        {
            code: String.raw`/\b(?:aa|aA|aB|ab)\b/i`,
            output: String.raw`/\b(?:aA|aa|aB|ab)\b/i`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
        {
            code: String.raw`/\b(?:1|2|4|8|16|32|64|128|256|0)\b/`,
            output: String.raw`/\b(?:0|1|2|4|8|16|32|64|128|256)\b/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },

        {
            code: String.raw`/\b(?:[Nn]umber|[Ss]tring|[Bb]oolean|Function|any|mixed|null|void)\b/`,
            output: String.raw`/\b(?:[Bb]oolean|Function|[Nn]umber|[Ss]tring|any|mixed|null|void)\b/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
        {
            code: String.raw`/_(?:SERVER|GET|POST|FILES|REQUEST|SESSION|ENV|COOKIE)\b/`,
            output: String.raw`/_(?:COOKIE|ENV|FILES|GET|POST|REQUEST|SERVER|SESSION)\b/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
        {
            code: String.raw`/\b[ui](?:128|16|32|64|8|size)\b/`,
            output: String.raw`/\b[ui](?:8|16|32|64|128|size)\b/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
        {
            code: String.raw`/\((?:TM|R|C)\)/`,
            output: String.raw`/\((?:C|R|TM)\)/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },

        // sorting slices

        {
            code: String.raw`/\b(?:\^|c|b|a)\b/`,
            output: String.raw`/\b(?:\^|a|b|c)\b/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },

        // issue GH#307
        {
            code: String.raw`/\b(?:green|gr[ae]y)\b/`,
            output: String.raw`/\b(?:gr[ae]y|green)\b/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
        {
            code: String.raw`/\b(?:(?:script|source)_foo|sample)\b/`,
            output: String.raw`/\b(?:sample|(?:script|source)_foo)\b/`,
            errors: [
                "The alternatives of this group can be sorted without affecting the regex.",
            ],
        },
    ],
})
