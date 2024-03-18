import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-character-class"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-character-class", rule as any, {
    valid: [
        `/regexp/`,
        `/[regexp]/`,
        `/reg|exp/`,

        String.raw`/(?:a|b)/`,
        String.raw`/(?:a|b|c\b)/`,
        String.raw`/(?:[ab]|c\b)/`,
        String.raw`/(?:[ab]|cd)/`,
        String.raw`/(?:[ab]|(c))/`,
        { code: String.raw`/a|b|c|\d/`, options: [{ minAlternatives: 5 }] },
    ],
    invalid: [
        String.raw`/a|b|c|\d/`,
        String.raw`/(a|b|c|\d)/`,
        String.raw`/(?:a|b|c|\d)/`,
        String.raw`/(?=a|b|c|\d)/`,
        String.raw`/(?<=a|b|c|\d)/`,
        String.raw`/a|b|c|\d|[d-f]/`,
        String.raw`/a|-|c|\d|c|[-d-f]/`,
        String.raw`/a|[.]|c|\d|c|[-d-f]/`,
        String.raw`const s = "a|b|\\d|c"
            new RegExp(s)`,
        String.raw`const s = "a|b|"+"c"
            new RegExp(s)`,

        String.raw`/a|b|c/`,
        String.raw`/]|a|b/`,
        String.raw`/-|a|c/`,
        String.raw`/a|-|c/`,
        String.raw`/a|[-]|c/`,
        String.raw`/(?:a|b|c)/`,
        String.raw`/(a|b|c)/`,
        String.raw`/(?<name>a|b|c)/`,
        String.raw`/(?:a|b|c|d\b)/`,
        String.raw`/(?:a|b\b|[c]|d)/`,
        String.raw`/(?:a|\w|\s|["'])/`,
        String.raw`/(?:\w|-|\+|\*|\/)+/`,
        String.raw`/(?=a|b|c)/`,
        String.raw`/(?!a|b|c)/`,
        String.raw`/(?<=a|b|c)/`,
        String.raw`/(?<!a|b|c)/`,
        String.raw`/(?=a|b|c|dd|e)/`,
        String.raw`/(?!a|b|c|dd|e)/`,
        String.raw`/(?<=a|b|c|dd|e)/`,
        String.raw`/(?<!a|b|c|dd|e)/`,
        String.raw`/[abc]|d/`,
        String.raw`/[abc]|d|ee/`,

        // always merge non-disjoint
        String.raw`/(?:a|\w|b\b)/`,
        String.raw`/(?:\w|a|b\b)/`,
        String.raw`/(?:\w|b\b|a)/`,

        // always do match all
        String.raw`/(?:\s|\S|b\b)/`,
        String.raw`/(?:\w|\D|b\b)/`,
        String.raw`/(?:\w|\W|b\b)/`,

        String.raw`/--?|-=|\+\+?|\+=|!=?|~|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=|\?|:/`,
        String.raw`/--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&|\|\|?|\?|\*|\/|~|\^|%/`,

        String.raw`/1|2|3|[\w--\d]/v`,
        String.raw`/1|&|&|[\w--\d]/v`,
        String.raw`/1|~|~|[\w--\d]|[\q{abc}]/v`,

        // only report affected alternatives
        String.raw`/foo|bar|a|b|c|baz/`,

        // minAlternatives option
        {
            code: String.raw`/(?:a|b)/`,
            options: [{ minAlternatives: 2 }],
        },
    ],
})
