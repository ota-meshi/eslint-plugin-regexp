import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-quantifier"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-quantifier", rule as any, {
    valid: [`/regexp/`, `/\\d_\\d/`],
    invalid: [
        {
            code: `/\\d\\d/`,
            output: `/\\d{2}/`,
            errors: [
                {
                    message:
                        'Unexpected consecutive same character sets. Use "{2}" instead.',
                    line: 1,
                    column: 2,
                    endColumn: 6,
                },
            ],
        },
        {
            code: `/aa/`,
            output: `/a{2}/`,
            errors: [
                {
                    message:
                        'Unexpected consecutive same characters. Use "{2}" instead.',
                    line: 1,
                    column: 2,
                    endColumn: 4,
                },
            ],
        },
        {
            code: `/\\d\\d?/`,
            output: `/\\d{1,2}/`,
            errors: [
                {
                    message:
                        'Unexpected consecutive same character sets. Use "{1,2}" instead.',
                    line: 1,
                    column: 2,
                    endColumn: 7,
                },
            ],
        },
        {
            code: `/(\\d\\d\\d*)/`,
            output: `/(\\d{2,})/`,
            errors: [
                {
                    message:
                        'Unexpected consecutive same character sets. Use "{2,}" instead.',
                    line: 1,
                    column: 3,
                    endColumn: 10,
                },
            ],
        },
        {
            code: String.raw`/\d\d\d\d-\d\d-\d\d/`,
            output: String.raw`/\d{4}-\d{2}-\d{2}/`,
            errors: [
                'Unexpected consecutive same character sets. Use "{4}" instead.',
                'Unexpected consecutive same character sets. Use "{2}" instead.',
                'Unexpected consecutive same character sets. Use "{2}" instead.',
            ],
        },
        {
            code: String.raw`/aa..\s\s\S\S\p{ASCII}\p{ASCII}/u`,
            output: String.raw`/a{2}..\s{2}\S\S\p{ASCII}{2}/u`,
            errors: [
                'Unexpected consecutive same characters. Use "{2}" instead.',
                'Unexpected consecutive same character sets. Use "{2}" instead.',
                'Unexpected consecutive same character sets. Use "{2}" instead.',
                'Unexpected consecutive same character sets. Use "{2}" instead.',
                'Unexpected consecutive same character sets. Use "{2}" instead.',
            ],
        },
        {
            code: `/aaaa(aaa)/u`,
            output: `/a{4}(a{3})/u`,
            errors: [
                'Unexpected consecutive same characters. Use "{4}" instead.',
                'Unexpected consecutive same characters. Use "{3}" instead.',
            ],
        },
        {
            code: `/(b)?aaaa(b)?/u`,
            output: `/(b)?a{4}(b)?/u`,
            errors: [
                'Unexpected consecutive same characters. Use "{4}" instead.',
            ],
        },
        {
            code: `
            const s = "\\\\d\\\\d"
            new RegExp(s)
            `,
            output: null,
            errors: [
                'Unexpected consecutive same character sets. Use "{2}" instead.',
            ],
        },
        {
            code: `/aa*/`,
            output: `/a+/`,
            errors: [
                'Unexpected consecutive same characters. Use "+" instead.',
            ],
        },
        {
            code: `/a*a*/`,
            output: `/a*/`,
            errors: [
                'Unexpected consecutive same characters. Use "*" instead.',
            ],
        },
        {
            code: `/a?a?a?/`,
            output: `/a{0,3}/`,
            errors: [
                'Unexpected consecutive same characters. Use "{0,3}" instead.',
            ],
        },
    ],
})
