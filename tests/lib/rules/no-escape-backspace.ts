import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-escape-backspace"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-escape-backspace", rule as any, {
    valid: ["/\\b/", "/\\u0008/", "/\\ch/", "/\\cH/"],
    invalid: [
        {
            code: "/[\\b]/",
            errors: [
                {
                    message: 'Unexpected "[\\b]". Use "\\u0008" instead.',
                    column: 3,
                    endColumn: 5,
                },
            ],
        },
    ],
})
