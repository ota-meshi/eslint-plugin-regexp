import { RuleTester } from "eslint"
import rule from "../../../lib/rules/require-unicode-sets-regexp"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("require-unicode-sets-regexp", rule as any, {
    valid: [String.raw`/[\P{ASCII}]/iu`, `/a/v`],
    invalid: [
        {
            code: `/a/`,
            output: null, // It will not auto-fix if it does not have the u flag.
            errors: ["Use the 'v' flag."],
        },
        {
            code: `/a/u`,
            output: `/a/v`,
            errors: ["Use the 'v' flag."],
        },
        {
            code: String.raw`/[\p{ASCII}]/iu`,
            output: String.raw`/[\p{ASCII}]/iv`,
            errors: ["Use the 'v' flag."],
        },
        {
            code: `/[[]/u`,
            output: null, // Converting to the v flag will result in a parsing error.
            errors: ["Use the 'v' flag."],
        },
        {
            code: String.raw`/[^\P{Lowercase_Letter}]/giu`,
            output: null, // Converting to the v flag changes the behavior of the character set.
            errors: ["Use the 'v' flag."],
        },
        {
            code: String.raw`/[^\P{ASCII}]/iu`,
            output: null, // Converting to the v flag changes the behavior of the character set.
            errors: ["Use the 'v' flag."],
        },
        {
            code: String.raw`/[\P{ASCII}]/iu`,
            output: null, // Converting to the v flag changes the behavior of the character set.
            errors: ["Use the 'v' flag."],
        },
    ],
})
