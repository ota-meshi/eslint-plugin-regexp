import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-escape-backspace"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-escape-backspace", rule as any, {
    valid: [
        "/\\b/",
        "/\\u0008/",
        "/\\ch/",
        "/\\cH/",
        String.raw`/[\q{\u0008}]/v`,
    ],
    invalid: [
        {
            code: "/[\\b]/",
            errors: [
                {
                    message: "Unexpected '[\\b]'. Use '\\u0008' instead.",
                    column: 3,
                    endColumn: 5,
                    suggestions: [
                        {
                            messageId: "suggest",
                            output: String.raw`/[\u0008]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/[\q{\b}]/v`,
            errors: [
                {
                    message: "Unexpected '[\\b]'. Use '\\u0008' instead.",
                    column: 6,
                    endColumn: 8,
                    suggestions: [
                        {
                            messageId: "suggest",
                            output: String.raw`/[\q{\u0008}]/v`,
                        },
                    ],
                },
            ],
        },
    ],
})
