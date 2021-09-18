import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-empty-character-class"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-empty-character-class", rule as any, {
    valid: [
        `/[a]/`,
        `/[a-z]/`,
        `/[a]?/`,
        `/[a]*/`,
        `/[[]/`,
        String.raw`/\[]/`,
        `/[^]/`,
        `/[()]/`,
        `/[ ]/`,
        String.raw`/[\s\S]/`,
        String.raw`/[\da-zA-Z_\W]/`,
    ],
    invalid: [
        {
            code: `/[]/`,
            errors: [
                {
                    message:
                        "Since this character class is empty, it cannot match all characters.",
                    line: 1,
                    column: 2,
                },
            ],
        },
        {
            code: `/abc[]/`,
            errors: [
                {
                    message:
                        "Since this character class is empty, it cannot match all characters.",
                    line: 1,
                    column: 5,
                },
            ],
        },
        {
            code: `/([])/`,
            errors: [
                {
                    message:
                        "Since this character class is empty, it cannot match all characters.",
                    line: 1,
                    column: 3,
                },
            ],
        },
        {
            code: `new RegExp("[]");`,
            errors: [
                {
                    message:
                        "Since this character class is empty, it cannot match all characters.",
                    line: 1,
                    column: 13,
                },
            ],
        },
        {
            code: String.raw`/[^\s\S]/`,
            errors: ["This character class cannot match all characters."],
        },
        {
            code: String.raw`/[^\da-zA-Z_\W]/`,
            errors: ["This character class cannot match all characters."],
        },
    ],
})
