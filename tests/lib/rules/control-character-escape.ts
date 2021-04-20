import { RuleTester } from "eslint"
import rule from "../../../lib/rules/control-character-escape"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("control-character-escape", rule as any, {
    valid: [
        String.raw`/\0\t\n\v\f\r/`,
        String.raw`RegExp(/\0\t\n\v\f\r/, "i")`,
        String.raw`RegExp("\0\t\n\v\f\r", "i")`,
        String.raw`RegExp("\\0\\t\\n\\v\\f\\r", "i")`,
        "/\\t/",
        "new RegExp('\t')",
    ],
    invalid: [
        {
            code: String.raw`/\x00/`,
            output: String.raw`/\0/`,
            errors: [
                "Unexpected control character escape '\\x00' (U+0000). Use '\\0' instead.",
            ],
        },
        {
            code: String.raw`/\x0a/`,
            output: String.raw`/\n/`,
            errors: [
                "Unexpected control character escape '\\x0a' (U+000a). Use '\\n' instead.",
            ],
        },
        {
            code: String.raw`/\cJ/`,
            output: String.raw`/\n/`,
            errors: [
                "Unexpected control character escape '\\cJ' (U+000a). Use '\\n' instead.",
            ],
        },
        {
            code: String.raw`/\u{a}/u`,
            output: String.raw`/\n/u`,
            errors: [
                "Unexpected control character escape '\\u{a}' (U+000a). Use '\\n' instead.",
            ],
        },
        {
            code: String.raw`RegExp("\\cJ")`,
            output: String.raw`RegExp("\\n")`,
            errors: [
                "Unexpected control character escape '\\cJ' (U+000a). Use '\\n' instead.",
            ],
        },
        {
            code: String.raw`RegExp("\\u{a}", "u")`,
            output: String.raw`RegExp("\\n", "u")`,
            errors: [
                "Unexpected control character escape '\\u{a}' (U+000a). Use '\\n' instead.",
            ],
        },

        {
            code: "/\\u0009/",
            output: "/\\t/",
            errors: [
                {
                    message:
                        "Unexpected control character escape '\\u0009' (U+0009). Use '\\t' instead.",
                    column: 2,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/\t/",
            output: "/\\t/",
            errors: [
                {
                    message:
                        "Unexpected control character escape '\t' (U+0009). Use '\\t' instead.",
                    column: 2,
                    endColumn: 3,
                },
            ],
        },
        {
            code: String.raw`
            const s = "\\u0009"
            new RegExp(s)
            `,
            output: String.raw`
            const s = "\\t"
            new RegExp(s)
            `,
            errors: [
                "Unexpected control character escape '\\u0009' (U+0009). Use '\\t' instead.",
            ],
        },
        {
            code: String.raw`
            const s = "\\u"+"0009"
            new RegExp(s)
            `,
            output: null,
            errors: [
                "Unexpected control character escape '\\u0009' (U+0009). Use '\\t' instead.",
            ],
        },
    ],
})
