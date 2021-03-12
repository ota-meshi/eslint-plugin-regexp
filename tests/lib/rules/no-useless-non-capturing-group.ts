import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-non-capturing-group"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-non-capturing-group", rule as any, {
    valid: [
        `/(?:abcd)?/`,
        `/(?:ab|cd)/`,
        `/(?:a|b)/`,
        `/(?:)/`,
        String.raw`/()\1(?:0)/`,
        String.raw`/\1(?:0)/`,
        String.raw`/\0(?:1)/`,
    ],
    invalid: [
        {
            code: `/(?:abcd)/`,
            output: `/abcd/`,
            errors: [
                {
                    message: "Unexpected quantifier Non-capturing group.",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 10,
                },
            ],
        },
        {
            code: `/(?:[abcd])/`,
            output: `/[abcd]/`,
            errors: [
                {
                    message: "Unexpected quantifier Non-capturing group.",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 12,
                },
            ],
        },
        {
            code: `/(?:[abcd]+?)/`,
            output: `/[abcd]+?/`,
            errors: [
                {
                    message: "Unexpected quantifier Non-capturing group.",
                    line: 1,
                    column: 2,
                },
            ],
        },
        {
            code: String.raw`/(?:0)/; /\1(?:0)/; /(?:1)/; /\1(?:1)/`,
            output: String.raw`/0/; /\1(?:0)/; /1/; /\1(?:1)/`,
            errors: [
                {
                    message: "Unexpected quantifier Non-capturing group.",
                    line: 1,
                    column: 2,
                },
                {
                    message: "Unexpected quantifier Non-capturing group.",
                    line: 1,
                    column: 22,
                },
            ],
        },
        {
            code: String.raw`/(?:a\n)/`,
            output: String.raw`/a\n/`,
            errors: ["Unexpected quantifier Non-capturing group."],
        },
        {
            code: String.raw`
            const s = "(?:a\\n)"
            new RegExp(s)`,
            output: null,
            errors: ["Unexpected quantifier Non-capturing group."],
        },
    ],
})
