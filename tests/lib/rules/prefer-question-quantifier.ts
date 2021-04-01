import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-question-quantifier"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-question-quantifier", rule as any, {
    valid: [
        "/a?/",
        "/a??/",
        "/(a?)/",
        "/(a??)/",
        "/[a{0,1}]/",
        "/a{0,}/",
        "/(?:a|b)/",
        "/a(?:|a)/",
        "/(?:abc||def)/",
        "/(?:)/",
        "/(?:||)/",
        "/(?:abc|def|)+/",
        "/(?:abc|def|)??/",
    ],
    invalid: [
        {
            code: "/a{0,1}/",
            output: "/a?/",
            errors: [
                {
                    message: 'Unexpected quantifier "{0,1}". Use "?" instead.',
                    column: 3,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/a{0,1}?/",
            output: "/a??/",
            errors: [
                {
                    message: 'Unexpected quantifier "{0,1}". Use "?" instead.',
                    column: 3,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/(a){0,1}/",
            output: "/(a)?/",
            errors: [
                {
                    message: 'Unexpected quantifier "{0,1}". Use "?" instead.',
                    column: 5,
                    endColumn: 10,
                },
            ],
        },
        {
            code: "/(a){0,1}?/",
            output: "/(a)??/",
            errors: [
                {
                    message: 'Unexpected quantifier "{0,1}". Use "?" instead.',
                    column: 5,
                    endColumn: 10,
                },
            ],
        },
        {
            code: "/(?:abc|)/",
            output: "/(?:abc)?/",
            errors: [
                {
                    message:
                        'Unexpected group "(?:abc|)". Use "(?:abc)?" instead.',
                    column: 2,
                    endColumn: 10,
                },
            ],
        },
        {
            code: "/(?:abc|def|)/",
            output: "/(?:abc|def)?/",
            errors: [
                {
                    message:
                        'Unexpected group "(?:abc|def|)". Use "(?:abc|def)?" instead.',
                    column: 2,
                    endColumn: 14,
                },
            ],
        },
        {
            code: "/(?:abc||def|)/",
            output: "/(?:abc||def)?/",
            errors: [
                'Unexpected group "(?:abc||def|)". Use "(?:abc||def)?" instead.',
            ],
        },
        {
            code: "/(?:abc|def||)/",
            output: "/(?:abc|def)?/",
            errors: [
                'Unexpected group "(?:abc|def||)". Use "(?:abc|def)?" instead.',
            ],
        },
        {
            code: "/(?:abc|def|)?/",
            output: "/(?:abc|def)?/",
            errors: [
                'Unexpected group "(?:abc|def|)?". Use "(?:abc|def)?" instead.',
            ],
        },
        {
            code: `
            const s = "a{0,1}"
            new RegExp(s)
            `,
            output: `
            const s = "a?"
            new RegExp(s)
            `,
            errors: ['Unexpected quantifier "{0,1}". Use "?" instead.'],
        },
        {
            code: `
            const s = "a{0,"+"1}"
            new RegExp(s)
            `,
            output: null,
            errors: ['Unexpected quantifier "{0,1}". Use "?" instead.'],
        },
        {
            code: `
            const s = "(?:abc|def|)"
            new RegExp(s)
            `,
            output: `
            const s = "(?:abc|def)?"
            new RegExp(s)
            `,
            errors: [
                'Unexpected group "(?:abc|def|)". Use "(?:abc|def)?" instead.',
            ],
        },
        {
            code: `
            const s = "(?:abc|"+"def|)"
            new RegExp(s)
            `,
            output: null,
            errors: [
                'Unexpected group "(?:abc|def|)". Use "(?:abc|def)?" instead.',
            ],
        },
    ],
})
