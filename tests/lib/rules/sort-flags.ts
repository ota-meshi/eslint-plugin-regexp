import { RuleTester } from "eslint"
import rule from "../../../lib/rules/sort-flags"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("sort-flags", rule as any, {
    valid: [
        String.raw`/\w/i`,
        String.raw`/\w/im`,
        String.raw`/\w/gi`,
        String.raw`/\w/gimsuy`,
        String.raw`new RegExp("\\w", "i")`,
        String.raw`new RegExp("\\w", "gi")`,
        String.raw`new RegExp("\\w", "gimsuy")`,

        // ignore
        String.raw`
        const flags = "yusimg"
        new RegExp("\\w", flags)
        `,
        {
            code: `
            new RegExp("abc", 'unknown')
            `,
            options: [{ order: ["s", "g"] }],
        },
        {
            code: `
            new RegExp("abc", 'unknown')
            `,
            options: [{ order: ["s", "g", "u"] }],
        },

        // options
        {
            code: `
            var foo = /abc/gs
            new RegExp("abc", "gs")
            `,
            options: [{ order: ["g", "i", "m", "u", "y", "s", "d"] }],
        },
        {
            code: `
            var foo = /abc/gimuys
            new RegExp("abc", "gimuysd")
            `,
            options: [{ order: ["g", "i", "m", "u", "y", "s", "d"] }],
        },
        {
            code: `
            var foo = /abc/gimuys
            var foo = /abc/gmuiys
            var foo = /abc/mugysi
            `,
            options: [{ order: ["g", "i"] }],
        },
    ],
    invalid: [
        {
            code: String.raw`/\w/yusimg`,
            output: String.raw`/\w/gimsuy`,
            errors: [
                {
                    message: "The flags 'yusimg' should in the order 'gimsuy'.",
                    column: 5,
                },
            ],
        },
        {
            code: String.raw`new RegExp("\\w", "yusimg")`,
            output: String.raw`new RegExp("\\w", "gimsuy")`,
            errors: [
                {
                    message: "The flags 'yusimg' should in the order 'gimsuy'.",
                    column: 20,
                },
            ],
        },
        {
            code: String.raw`/\w/yusimg`,
            output: String.raw`/\w/gimuys`,
            options: [{ order: ["g", "i", "m", "u", "y", "s", "d"] }],
            errors: [
                {
                    message: "The flags 'yusimg' should in the order 'gimuys'.",
                    column: 5,
                },
            ],
        },
        {
            code: String.raw`new RegExp("\\w", "dyusimg")`,
            output: String.raw`new RegExp("\\w", "gimuysd")`,
            options: [{ order: ["g", "i", "m", "u", "y", "s", "d"] }],
            errors: [
                {
                    message:
                        "The flags 'dyusimg' should in the order 'gimuysd'.",
                    column: 20,
                },
            ],
        },
        {
            code: `
            var foo = /abc/sg
            new RegExp("abc", "sgd")
            `,
            output: `
            var foo = /abc/gs
            new RegExp("abc", "gsd")
            `,
            options: [{ order: ["g", "i", "m", "u", "y", "s", "d"] }],
            errors: [
                {
                    message: "The flags 'sg' should in the order 'gs'.",
                    column: 28,
                },
                {
                    message: "The flags 'sgd' should in the order 'gsd'.",
                    column: 32,
                },
            ],
        },
        {
            code: `
            var foo = /abc/imugys
            var foo = /abc/muiygs
            var foo = /abc/muiysg
            `,
            output: `
            var foo = /abc/gimuys
            var foo = /abc/mugiys
            var foo = /abc/mugiys
            `,
            options: [{ order: ["g", "i"] }],
            errors: [
                {
                    message: "The flags 'imugys' should in the order 'gimuys'.",
                    column: 28,
                },
                {
                    message: "The flags 'muiygs' should in the order 'mugiys'.",
                    column: 28,
                },
                {
                    message: "The flags 'muiysg' should in the order 'mugiys'.",
                    column: 28,
                },
            ],
        },
        {
            code: `
            new RegExp("abc", 'flags')
            new RegExp("abc", 'unknown')
            `,
            output: `
            new RegExp("abc", 'afgls')
            new RegExp("abc", 'knnnouw')
            `,
            errors: [
                {
                    message: "The flags 'flags' should in the order 'afgls'.",
                    line: 2,
                    column: 32,
                },
                {
                    message:
                        "The flags 'unknown' should in the order 'knnnouw'.",
                    line: 3,
                    column: 32,
                },
            ],
        },
        {
            code: `
            new RegExp("abc", 'flags')
            new RegExp("abc", 'unknown')
            `,
            output: `
            new RegExp("abc", 'flasg')
            new RegExp("abc", 'unnnkow')
            `,
            options: [{ order: ["s", "g", "u", "o"] }],
            errors: [
                {
                    message: "The flags 'flags' should in the order 'flasg'.",
                    line: 2,
                    column: 32,
                },
                {
                    message:
                        "The flags 'unknown' should in the order 'unnnkow'.",
                    line: 3,
                    column: 32,
                },
            ],
        },
    ],
})
