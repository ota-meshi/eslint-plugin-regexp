import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-named-capture-group"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-named-capture-group", rule as any, {
    valid: [
        String.raw`/foo/`,
        String.raw`/b(?:a(?:r))/`,
        String.raw`/(?<foo>bar)/`,
        String.raw`/(?=a)(?<=b)/`,
    ],
    invalid: [
        {
            code: String.raw`/(foo)/`,
            errors: [
                "Capture group '(foo)' should be converted to a named or non-capturing group.",
            ],
        },
    ],
})
