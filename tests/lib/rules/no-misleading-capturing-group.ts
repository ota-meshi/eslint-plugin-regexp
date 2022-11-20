import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-misleading-capturing-group"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-misleading-capturing-group", rule as any, {
    valid: [`/a+a+/`, `/(a+a+)/`, `/(a+a+)b+/`],
    invalid: [
        {
            code: String.raw`/\d+(\d*)/`,
            errors: [
                "'\\d*' can be removed because it is already included by '\\d+'. This makes the capturing group misleading because it actually captures less text than its pattern suggests.",
            ],
        },
        {
            code: String.raw`/(?:!\d+|%\w+)(\d*)/`,
            errors: [
                "'\\d*' can be removed because it is already included by '\\d+' and '\\w+'. This makes the capturing group misleading because it actually captures less text than its pattern suggests.",
            ],
        },
    ],
})
