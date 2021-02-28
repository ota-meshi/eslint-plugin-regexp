import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-character-class"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-character-class", rule as any, {
    valid: [
        `/regexp/`,
        `/[^a]/`,
        `/[^\\d]/`,
        `/[\\s\\S]/`,
        `/[=]/ // ignore`,
        {
            code: `/[a]/`,
            options: [{ ignores: ["a"] }],
        },
        {
            code: `/[\\d]/`,
            options: [{ ignores: ["\\d"] }],
        },
    ],
    invalid: [
        {
            code: `/[a]/`,
            output: `/a/`,
            errors: [
                {
                    message:
                        "Unexpected character class with one character. Can remove brackets.",
                    line: 1,
                    column: 2,
                },
            ],
        },
        {
            code: `/[\\d]/`,
            output: `/\\d/`,
            errors: [
                {
                    message:
                        "Unexpected character class with one character set. Can remove brackets.",
                    line: 1,
                    column: 2,
                },
            ],
        },
        {
            code: `/[=]/`,
            output: `/=/`,
            options: [{ ignores: [] }],
            errors: [
                "Unexpected character class with one character. Can remove brackets.",
            ],
        },
        {
            code: `/[\\D]/`,
            output: `/\\D/`,
            options: [{ ignores: ["\\d"] }],
            errors: [
                "Unexpected character class with one character set. Can remove brackets.",
            ],
        },
    ],
})
