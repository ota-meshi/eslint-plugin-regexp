import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-control-character"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-control-character", rule as any, {
    valid: [
        String.raw`/x1f/`,
        String.raw`/\\x1f/`,
        String.raw`new RegExp('x1f')`,
        String.raw`RegExp('x1f')`,
        String.raw`new RegExp('[')`,
        String.raw`RegExp('[')`,
        String.raw`new (function foo(){})('\x1f')`,
        String.raw`new RegExp('\n')`,
        String.raw`new RegExp('\\n')`,
    ],
    invalid: [
        {
            code: String.raw`/\x1f/`,
            errors: [{ messageId: "unexpected", suggestions: [] }],
        },
        {
            code: String.raw`/\\\x1f\\x1e/`,
            errors: [{ messageId: "unexpected", suggestions: [] }],
        },
        {
            code: String.raw`/\\\x1fFOO\\x00/`,
            errors: [{ messageId: "unexpected", suggestions: [] }],
        },
        {
            code: String.raw`/FOO\\\x1fFOO\\x1f/`,
            errors: [{ messageId: "unexpected", suggestions: [] }],
        },
        {
            code: String.raw`new RegExp('\x1f\x1e')`,
            errors: [
                { messageId: "unexpected", suggestions: [] },
                { messageId: "unexpected", suggestions: [] },
            ],
        },
        {
            code: String.raw`new RegExp('\x1fFOO\x00')`,
            errors: [
                { messageId: "unexpected", suggestions: [] },
                {
                    messageId: "unexpected",
                    suggestions: [
                        { output: String.raw`new RegExp('\x1fFOO\\0')` },
                    ],
                },
            ],
        },
        {
            code: String.raw`new RegExp('FOO\x1fFOO\x1f')`,
            errors: [
                { messageId: "unexpected", suggestions: [] },
                { messageId: "unexpected", suggestions: [] },
            ],
        },
        {
            code: String.raw`RegExp('\x1f')`,
            errors: [{ messageId: "unexpected", suggestions: [] }],
        },
        {
            code: String.raw`RegExp('\\x1f')`,
            errors: [{ messageId: "unexpected", suggestions: [] }],
        },
        {
            code: String.raw`RegExp('\\\x1f')`,
            errors: [{ messageId: "unexpected", suggestions: [] }],
        },
        {
            code: String.raw`RegExp('\x0a')`,
            errors: [
                {
                    messageId: "unexpected",
                    suggestions: [{ output: String.raw`RegExp('\\n')` }],
                },
            ],
        },
        {
            code: String.raw`RegExp('\\x0a')`,
            errors: [
                {
                    messageId: "unexpected",
                    suggestions: [{ output: String.raw`RegExp('\\n')` }],
                },
            ],
        },
        {
            code: String.raw`RegExp('\\\x0a')`,
            errors: [
                {
                    messageId: "unexpected",
                    suggestions: [{ output: String.raw`RegExp('\\n')` }],
                },
            ],
        },
        {
            code: String.raw`/[\q{\x1f}]/v`,
            errors: [{ messageId: "unexpected", suggestions: [] }],
        },
    ],
})
