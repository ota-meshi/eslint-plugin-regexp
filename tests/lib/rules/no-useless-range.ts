import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-range"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-range", rule as any, {
    valid: [`/[a]/`, `/[ab]/`, `/[a-c]/`],
    invalid: [
        {
            code: `/[a-a]/`,
            output: `/[a]/`,
            errors: [
                {
                    message:
                        "Unexpected unnecessary range of characters by using a hyphen.",
                    line: 1,
                    column: 3,
                },
            ],
        },
        {
            code: `/[a-b]/`,
            output: `/[ab]/`,
            errors: [
                {
                    message:
                        "Unexpected unnecessary range of characters by using a hyphen.",
                    line: 1,
                    column: 3,
                },
            ],
        },
        {
            code: `/[a-a-c-c]/`,
            output: `/[a\\-c]/`,
            errors: [
                {
                    message:
                        "Unexpected unnecessary range of characters by using a hyphen.",
                    line: 1,
                    column: 3,
                },
                {
                    message:
                        "Unexpected unnecessary range of characters by using a hyphen.",
                    line: 1,
                    column: 7,
                },
            ],
        },
        {
            code: `/[a-abc]/`,
            output: `/[abc]/`,
            errors: [
                {
                    message:
                        "Unexpected unnecessary range of characters by using a hyphen.",
                    line: 1,
                    column: 3,
                },
            ],
        },
        {
            code: `
            const s = "[a-a-c]"
            new RegExp(s)`,
            output: `
            const s = "[a\\\\-c]"
            new RegExp(s)`,
            errors: [
                "Unexpected unnecessary range of characters by using a hyphen.",
            ],
        },
        {
            code: `
            const s = "[a-"+"a]"
            new RegExp(s)`,
            output: null,
            errors: [
                "Unexpected unnecessary range of characters by using a hyphen.",
            ],
        },
        {
            code: `
            /[,--b]/;
            /[\\c-d]/;
            /[\\x6-7]/;
            /[\\u002-3]/;
            `,
            output: `
            /[,\\-b]/;
            /[\\c-d]/;
            /[\\x6-7]/;
            /[\\u002-3]/;
            `,
            errors: [
                "Unexpected unnecessary range of characters by using a hyphen.",
                "Unexpected unnecessary range of characters by using a hyphen.",
                "Unexpected unnecessary range of characters by using a hyphen.",
                "Unexpected unnecessary range of characters by using a hyphen.",
            ],
        },
        {
            code: `
            /[,-\\-b]/;
            /[c-d]/;
            /[x6-7]/;
            /[u002-3]/;
            `,
            output: `
            /[,\\-b]/;
            /[cd]/;
            /[x67]/;
            /[u0023]/;
            `,
            errors: [
                "Unexpected unnecessary range of characters by using a hyphen.",
                "Unexpected unnecessary range of characters by using a hyphen.",
                "Unexpected unnecessary range of characters by using a hyphen.",
                "Unexpected unnecessary range of characters by using a hyphen.",
            ],
        },
    ],
})
