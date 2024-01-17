import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/sort-flags"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("sort-flags", rule as any, {
    valid: [
        String.raw`/\w/i`,
        String.raw`/\w/im`,
        String.raw`/\w/gi`,
        String.raw`/\w/gimsuy`,
        String.raw`/\w/gimsvy`,
        String.raw`new RegExp("\\w", "i")`,
        String.raw`new RegExp("\\w", "gi")`,
        String.raw`new RegExp("\\w", "gimsuy")`,
        String.raw`new RegExp("\\w", "dgimsuy")`,
        String.raw`new RegExp("\\w", "dgimsvy")`,

        // ignore
        String.raw`
        const flags = "yusimg"
        new RegExp("\\w", flags)
        new RegExp("\\w", flags)
        `,
    ],
    invalid: [
        {
            code: String.raw`/\w/yusimg`,
            output: String.raw`/\w/gimsuy`,
            errors: [
                {
                    message:
                        "The flags 'yusimg' should be in the order 'gimsuy'.",
                    column: 5,
                },
            ],
        },
        {
            code: String.raw`/\w/yvsimg`,
            output: String.raw`/\w/gimsvy`,
            errors: ["The flags 'yvsimg' should be in the order 'gimsvy'."],
        },
        {
            code: String.raw`new RegExp("\\w", "yusimg")`,
            output: String.raw`new RegExp("\\w", "gimsuy")`,
            errors: [
                {
                    message:
                        "The flags 'yusimg' should be in the order 'gimsuy'.",
                    column: 20,
                },
            ],
        },
        {
            code: String.raw`new RegExp("\\w", "yusimgd")`,
            output: String.raw`new RegExp("\\w", "dgimsuy")`,
            errors: [
                {
                    message:
                        "The flags 'yusimgd' should be in the order 'dgimsuy'.",
                    column: 20,
                },
            ],
        },
        {
            // sort flags even on invalid patterns
            code: String.raw`new RegExp("\\w)", "ui")`,
            output: String.raw`new RegExp("\\w)", "iu")`,
            errors: [
                {
                    message: "The flags 'ui' should be in the order 'iu'.",
                    column: 21,
                },
            ],
        },
        {
            // sort flags even on unknown
            code: String.raw`RegExp('a' + b, 'us');`,
            output: String.raw`RegExp('a' + b, 'su');`,
            errors: [
                {
                    message: "The flags 'us' should be in the order 'su'.",
                    column: 18,
                },
            ],
        },
        {
            // sort flags even on non-owned pattern
            code: String.raw`var a = "foo"; RegExp(foo, 'us'); RegExp(foo, 'u');`,
            output: String.raw`var a = "foo"; RegExp(foo, 'su'); RegExp(foo, 'u');`,
            errors: [
                {
                    message: "The flags 'us' should be in the order 'su'.",
                    column: 29,
                },
            ],
        },
    ],
})
