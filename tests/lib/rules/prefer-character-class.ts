import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-character-class"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
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
        {
            code: String.raw`/a|b|c|\d/`,
            output: String.raw`/[abc\d]/`,
            errors: [
                {
                    message:
                        "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 10,
                },
            ],
        },
        {
            code: String.raw`/(a|b|c|\d)/`,
            output: String.raw`/([abc\d])/`,
            errors: [
                {
                    message:
                        "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
                    line: 1,
                    column: 3,
                    endLine: 1,
                    endColumn: 11,
                },
            ],
        },
        {
            code: String.raw`/(?:a|b|c|\d)/`,
            output: String.raw`/(?:[abc\d])/`,
            errors: [
                {
                    message:
                        "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
                    line: 1,
                    column: 5,
                    endLine: 1,
                    endColumn: 13,
                },
            ],
        },
        {
            code: String.raw`/(?=a|b|c|\d)/`,
            output: String.raw`/(?=[abc\d])/`,
            errors: [
                {
                    message:
                        "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
                    line: 1,
                    column: 5,
                    endLine: 1,
                    endColumn: 13,
                },
            ],
        },
        {
            code: String.raw`/(?<=a|b|c|\d)/`,
            output: String.raw`/(?<=[abc\d])/`,
            errors: [
                {
                    message:
                        "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
                    line: 1,
                    column: 6,
                    endLine: 1,
                    endColumn: 14,
                },
            ],
        },
        {
            code: String.raw`/a|b|c|\d|[d-f]/`,
            output: String.raw`/[abc\dd-f]/`,
            errors: [
                "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
            ],
        },
        {
            code: String.raw`/a|-|c|\d|c|[-d-f]/`,
            output: String.raw`/[a\-c\dc\-d-f]/`,
            errors: [
                "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
            ],
        },
        {
            code: String.raw`/a|[.]|c|\d|c|[-d-f]/`,
            output: String.raw`/[a.c\dc\-d-f]/`,
            errors: [
                "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
            ],
        },
        {
            code: String.raw`const s = "a|b|\\d|c"
            new RegExp(s)`,
            output: String.raw`const s = "[ab\\dc]"
            new RegExp(s)`,
            errors: [
                "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
            ],
        },
        {
            code: String.raw`const s = "a|b|"+"c"
            new RegExp(s)`,
            output: null,
            errors: [
                "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
            ],
        },

        { code: String.raw`/a|b|c/`, output: String.raw`/[abc]/`, errors: 1 },
        { code: String.raw`/]|a|b/`, output: String.raw`/[\]ab]/`, errors: 1 },
        { code: String.raw`/-|a|c/`, output: String.raw`/[-ac]/`, errors: 1 },
        { code: String.raw`/a|-|c/`, output: String.raw`/[a\-c]/`, errors: 1 },
        {
            code: String.raw`/a|[-]|c/`,
            output: String.raw`/[a\-c]/`,
            errors: 1,
        },
        {
            code: String.raw`/(?:a|b|c)/`,
            output: String.raw`/(?:[abc])/`,
            errors: 1,
        },
        {
            code: String.raw`/(a|b|c)/`,
            output: String.raw`/([abc])/`,
            errors: 1,
        },
        {
            code: String.raw`/(?<name>a|b|c)/`,
            output: String.raw`/(?<name>[abc])/`,
            errors: 1,
        },
        {
            code: String.raw`/(?:a|b|c|d\b)/`,
            output: String.raw`/(?:[abc]|d\b)/`,
            errors: 1,
        },
        {
            code: String.raw`/(?:a|b\b|[c]|d)/`,
            output: String.raw`/(?:[acd]|b\b)/`,
            errors: 1,
        },
        {
            code: String.raw`/(?:a|\w|\s|["'])/`,
            output: String.raw`/(?:[a\w\s"'])/`,
            errors: 1,
        },
        {
            code: String.raw`/(?:\w|-|\+|\*|\/)+/`,
            output: String.raw`/(?:[\w\-\+\*\/])+/`,
            errors: 1,
        },
        {
            code: String.raw`/(?=a|b|c)/`,
            output: String.raw`/(?=[abc])/`,
            errors: 1,
        },
        {
            code: String.raw`/(?!a|b|c)/`,
            output: String.raw`/(?![abc])/`,
            errors: 1,
        },
        {
            code: String.raw`/(?<=a|b|c)/`,
            output: String.raw`/(?<=[abc])/`,
            errors: 1,
        },
        {
            code: String.raw`/(?<!a|b|c)/`,
            output: String.raw`/(?<![abc])/`,
            errors: 1,
        },
        {
            code: String.raw`/(?=a|b|c|dd|e)/`,
            output: String.raw`/(?=[abce]|dd)/`,
            errors: 1,
        },
        {
            code: String.raw`/(?!a|b|c|dd|e)/`,
            output: String.raw`/(?![abce]|dd)/`,
            errors: 1,
        },
        {
            code: String.raw`/(?<=a|b|c|dd|e)/`,
            output: String.raw`/(?<=[abce]|dd)/`,
            errors: 1,
        },
        {
            code: String.raw`/(?<!a|b|c|dd|e)/`,
            output: String.raw`/(?<![abce]|dd)/`,
            errors: 1,
        },
        {
            code: String.raw`/[abc]|d/`,
            output: String.raw`/[abcd]/`,
            errors: 1,
        },
        {
            code: String.raw`/[abc]|d|ee/`,
            output: String.raw`/[abcd]|ee/`,
            errors: 1,
        },

        // always merge non-disjoint
        {
            code: String.raw`/(?:a|\w|b\b)/`,
            output: String.raw`/(?:[a\w]|b\b)/`,
            errors: 1,
        },
        {
            code: String.raw`/(?:\w|a|b\b)/`,
            output: String.raw`/(?:[\wa]|b\b)/`,
            errors: 1,
        },
        {
            code: String.raw`/(?:\w|b\b|a)/`,
            output: String.raw`/(?:[\wa]|b\b)/`,
            errors: 1,
        },

        // always do match all
        {
            code: String.raw`/(?:\s|\S|b\b)/`,
            output: String.raw`/(?:[\s\S]|b\b)/`,
            errors: 1,
        },
        {
            code: String.raw`/(?:\w|\D|b\b)/`,
            output: String.raw`/(?:[\w\D]|b\b)/`,
            errors: 1,
        },
        {
            code: String.raw`/(?:\w|\W|b\b)/`,
            output: String.raw`/(?:[\w\W]|b\b)/`,
            errors: 1,
        },

        {
            code: String.raw`/--?|-=|\+\+?|\+=|!=?|~|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=|\?|:/`,
            output: String.raw`/--?|-=|\+\+?|\+=|!=?|[~\?:]|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=/`,
            errors: 1,
        },
        {
            code: String.raw`/--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&|\|\|?|\?|\*|\/|~|\^|%/`,
            output: String.raw`/--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&|\|\|?|[\?\*\/~\^%]/`,
            errors: 1,
        },

        // only report affected alternatives
        {
            code: String.raw`/foo|bar|a|b|c|baz/`,
            output: String.raw`/foo|bar|[abc]|baz/`,
            errors: [
                {
                    message:
                        "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
                    line: 1,
                    column: 10,
                    endLine: 1,
                    endColumn: 15,
                },
            ],
        },

        // minAlternatives option
        {
            code: String.raw`/(?:a|b)/`,
            output: String.raw`/(?:[ab])/`,
            options: [{ minAlternatives: 2 }],
            errors: 1,
        },
    ],
})
