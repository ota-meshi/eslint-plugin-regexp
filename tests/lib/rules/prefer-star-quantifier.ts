import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-star-quantifier"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-star-quantifier", rule as any, {
    valid: ["/a*/", "/a*?/", "/(a*)/", "/(a*?)/", "/[a{0,}]/", "/a{0,10}/"],
    invalid: [
        {
            code: "/a{0,}/",
            output: "/a*/",
            errors: [
                {
                    message: "Unexpected quantifier '{0,}'. Use '*' instead.",
                    column: 3,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/a{0,}?/",
            output: "/a*?/",
            errors: [
                {
                    message: "Unexpected quantifier '{0,}'. Use '*' instead.",
                    column: 3,
                    endColumn: 7,
                },
            ],
        },
        {
            code: "/(a){0,}/",
            output: "/(a)*/",
            errors: [
                {
                    message: "Unexpected quantifier '{0,}'. Use '*' instead.",
                    column: 5,
                    endColumn: 9,
                },
            ],
        },
        {
            code: "/(a){0,}/v",
            output: "/(a)*/v",
            errors: ["Unexpected quantifier '{0,}'. Use '*' instead."],
        },
        {
            code: "/(a){0,}?/",
            output: "/(a)*?/",
            errors: [
                {
                    message: "Unexpected quantifier '{0,}'. Use '*' instead.",
                    column: 5,
                    endColumn: 9,
                },
            ],
        },
        {
            code: `
            const s = "a{0,}"
            new RegExp(s)
            `,
            output: `
            const s = "a*"
            new RegExp(s)
            `,
            errors: ["Unexpected quantifier '{0,}'. Use '*' instead."],
        },
        {
            code: `
            const s = "a{0"+",}"
            new RegExp(s)
            `,
            output: null,
            errors: ["Unexpected quantifier '{0,}'. Use '*' instead."],
        },
    ],
})
