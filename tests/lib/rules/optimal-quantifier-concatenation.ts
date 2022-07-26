import { RuleTester } from "eslint"
import rule from "../../../lib/rules/optimal-quantifier-concatenation"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("optimal-quantifier-concatenation", rule as any, {
    valid: [
        String.raw`/\w+\d{4}/`,
        String.raw`/\w+a/`,
        String.raw`/\w{3,5}\d{2,4}/`,
        String.raw`/\w{3,5}\d*/`,
        String.raw`/a+b+c+d+[abc]+/`,
        String.raw`/(?:a|::)?\w+/`,
        String.raw`/\d+(?:\w+|-\d+)/`,
        String.raw`/aa?/`,
        String.raw`/\w?\w/`,
    ],
    invalid: [
        {
            code: String.raw`/[a-fA-F][a-fA-F]?/`,
            output: String.raw`/[a-fA-F]{1,2}/`,
            errors: [
                "'[a-fA-F]' and '[a-fA-F]?' can be combined into one quantifier '[a-fA-F]{1,2}'.",
            ],
        },
        {
            code: String.raw`/a\d*\d*a/`,
            output: String.raw`/a\d*a/`,
            errors: [
                "'\\d*' can be removed because it is already included by '\\d*'.",
            ],
        },
        {
            code: String.raw`/\w+\d+/`,
            output: String.raw`/\w+\d/`,
            errors: ["'\\w+' and '\\d+' can be replaced with '\\w+\\d'."],
        },
        {
            code: String.raw`/\w+\d?/`,
            output: String.raw`/\w+/`,
            errors: [
                "'\\d?' can be removed because it is already included by '\\w+'.",
            ],
        },
        {
            code: String.raw`/a+\w+/`,
            output: String.raw`/a\w+/`,
            errors: ["'a+' and '\\w+' can be replaced with 'a\\w+'."],
        },
        {
            code: String.raw`/\w+\d*/`,
            output: String.raw`/\w+/`,
            errors: [
                "'\\d*' can be removed because it is already included by '\\w+'.",
            ],
        },
        {
            code: String.raw`/(\d*\w+)/`,
            output: String.raw`/(\w+)/`,
            errors: [
                "'\\d*' can be removed because it is already included by '\\w+'.",
            ],
        },
        {
            code: String.raw`/;+.*/`,
            output: String.raw`/;.*/`,
            errors: ["';+' and '.*' can be replaced with ';.*'."],
        },
        {
            code: String.raw`/a+(?:a|bb)+/`,
            output: String.raw`/a(?:a|bb)+/`,
            errors: ["'a+' and '(?:a|bb)+' can be replaced with 'a(?:a|bb)+'."],
        },
        {
            code: String.raw`/\w+(?:a|b)+/`,
            output: String.raw`/\w+(?:a|b)/`,
            errors: [
                "'\\w+' and '(?:a|b)+' can be replaced with '\\w+(?:a|b)'.",
            ],
        },
        {
            code: String.raw`/\d{3,5}\w*/`,
            output: String.raw`/\d{3}\w*/`,
            errors: [
                "'\\d{3,5}' and '\\w*' can be replaced with '\\d{3}\\w*'.",
            ],
        },

        {
            code: String.raw`/\w\w*/`,
            output: String.raw`/\w+/`,
            errors: [
                "'\\w' and '\\w*' can be combined into one quantifier '\\w+'.",
            ],
        },
        {
            code: String.raw`/\w*\w/`,
            output: String.raw`/\w+/`,
            errors: [
                "'\\w*' and '\\w' can be combined into one quantifier '\\w+'.",
            ],
        },
        {
            code: String.raw`/\w+\w/`,
            output: String.raw`/\w{2,}/`,
            errors: [
                "'\\w+' and '\\w' can be combined into one quantifier '\\w{2,}'.",
            ],
        },
        {
            code: String.raw`/\w+\w{4}/`,
            output: String.raw`/\w{5,}/`,
            errors: [
                "'\\w+' and '\\w{4}' can be combined into one quantifier '\\w{5,}'.",
            ],
        },
        {
            code: String.raw`/\w+\w{4}?/`,
            output: String.raw`/\w{5,}/`,
            errors: [
                "'\\w+' and '\\w{4}?' can be combined into one quantifier '\\w{5,}'.",
            ],
        },
        {
            code: String.raw`/\w{4}\w{4}?/`,
            output: String.raw`/\w{8}/`,
            errors: [
                "'\\w{4}' and '\\w{4}?' can be combined into one quantifier '\\w{8}'.",
            ],
        },
        {
            code: String.raw`/[ab]*(?:a|b)/`,
            output: String.raw`/[ab]+/`,
            errors: [
                "'[ab]*' and '(?:a|b)' can be combined into one quantifier '[ab]+'.",
            ],
        },
        {
            code: String.raw`/aa*/`,
            output: String.raw`/a+/`,
            errors: ["'a' and 'a*' can be combined into one quantifier 'a+'."],
        },
        {
            code: String.raw`/a*a*/`,
            output: String.raw`/a*/`,
            errors: [
                "'a*' can be removed because it is already included by 'a*'.",
            ],
        },
        {
            code: String.raw`/a?a?a?/`,
            output: String.raw`/a{0,2}a?/`,
            errors: [
                "'a?' and 'a?' can be replaced with 'a{0,2}'.",
                "'a?' and 'a?' can be replaced with 'a{0,2}'.",
            ],
        },
        {
            code: String.raw`/a.{1,3}?.{2,4}?c/`,
            output: String.raw`/a.{3,7}?c/`,
            errors: ["'.{1,3}?' and '.{2,4}?' can be replaced with '.{3,7}?'."],
        },
        {
            code: String.raw`/a.{1,3}.{2,4}c/`,
            output: String.raw`/a.{3,7}c/`,
            errors: ["'.{1,3}' and '.{2,4}' can be replaced with '.{3,7}'."],
        },
        {
            code: String.raw`/\w+(?:foo|bar)?/`,
            output: String.raw`/\w+/`,
            errors: [
                "'(?:foo|bar)?' can be removed because it is already included by '\\w+'.",
            ],
        },
        {
            code: String.raw`/[ab]*(?:a|bb)+/`,
            output: String.raw`/[ab]*(?:a|bb)/`,
            errors: [
                "'[ab]*' and '(?:a|bb)+' can be replaced with '[ab]*(?:a|bb)'.",
            ],
        },
        {
            code: String.raw`/(?:\d+|abc)\w+/`,
            output: String.raw`/(?:\d|abc)\w+/`,
            errors: ["'\\d+' can be replaced with '\\d' because of '\\w+'."],
        },
        {
            code: String.raw`/(^[ \t]*)[a-z\d].+(?::{2,4}|;;)(?=\s)/im`,
            output: String.raw`/(^[ \t]*)[a-z\d].+(?::{2}|;;)(?=\s)/im`,
            errors: ["':{2,4}' can be replaced with ':{2}' because of '.+'."],
        },
        {
            code: String.raw`/(^[\t ]*)#(?:const|else(?:[\t ]+if)?|end[\t ]+if|error|if).*/im`,
            output: String.raw`/(^[\t ]*)#(?:const|else|end[\t ]+if|error|if).*/im`,
            errors: ["'(?:[\\t ]+if)?' can be removed because of '.*'."],
        },
        {
            code: String.raw`/(&(?:\r\n?|\n)\s*)!.*/`,
            output: String.raw`/(&(?:\r|\n)\s*)!.*/`,
            errors: ["'\\n?' can be removed because of '\\s*'."],
        },

        // careful with capturing groups
        {
            code: String.raw`/\w+(?:(a)|b)*/`,
            output: null,
            errors: [
                "'(?:(a)|b)*' can be removed because it is already included by '\\w+'. This cannot be fixed automatically because it might change or remove a capturing group.",
            ],
        },
        {
            code: String.raw`/(\d)*\w+/`,
            output: null,
            errors: [
                "'(\\d)*' can be removed because it is already included by '\\w+'. This cannot be fixed automatically because it might change or remove a capturing group.",
            ],
        },
        {
            code: String.raw`/(\d)\d+/`,
            output: null,
            errors: [
                "'(\\d)' and '\\d+' can be combined into one quantifier '\\d{2,}'. This cannot be fixed automatically because it might change or remove a capturing group.",
            ],
        },
        {
            code: String.raw`/(\d)\d+/`,
            output: null,
            options: [{ capturingGroups: "ignore" }],
            errors: [],
        },
    ],
})
