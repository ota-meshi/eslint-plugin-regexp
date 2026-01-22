import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/sort-alternatives.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
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
        String.raw`/\b(x?Rec|RequestOptionsPage)\b/`,
        String.raw`/\b([ft]|false|true)\b/`,
        String.raw`/\b(a+b|a+c)\b/`,
        String.raw` /[\q{blue|green|red}]/v`,
    ],
    invalid: [
        String.raw`/c|b|a/`,
        String.raw`/c|bb|a/`,
        String.raw`/\b(?:c|b|a)\b/`,
        String.raw`/\b(?:A|a|C|c|B|b)\b/`,
        String.raw`/\b(?:aa|aA|aB|ab)\b/`,
        String.raw`/\b(?:A|a|C|c|B|b)\b/i`,
        String.raw`/\b(?:a|A|c|C|b|B)\b/i`,
        String.raw`/\b(?:aa|aA|aB|ab)\b/i`,
        String.raw`/\b(?:1|2|4|8|16|32|64|128|256|0)\b/`,

        String.raw`/\b(?:[Nn]umber|[Ss]tring|[Bb]oolean|Function|any|mixed|null|void)\b/`,
        String.raw`/_(?:SERVER|GET|POST|FILES|REQUEST|SESSION|ENV|COOKIE)\b/`,
        String.raw`/\b[ui](?:128|16|32|64|8|size)\b/`,
        String.raw`/\((?:TM|R|C)\)/`,

        // sorting slices

        String.raw`/\b(?:\^|c|b|a)\b/`,

        // issue GH#307
        String.raw`/\b(?:green|gr[ae]y)\b/`,
        String.raw`/\b(?:(?:script|source)_foo|sample)\b/`,
        String.raw`/[\q{red|green|blue}]/v`,
        String.raw`/(?:c|[\q{red|green|blue}]|a)/v`,
        String.raw`/[\q{ac|ab|aa}]/v`,
        String.raw`/(?:b|[a-b])/v`,
        String.raw`/\b(?:a[\q{bd}]|abc)\b/v`,
        String.raw`/\b(?:abb|[\q{a|aba}]bb)\b/v`,
        String.raw`/\b(?:c|b_|[\q{b|da}]_|b_2)\b/v`,
    ],
})
