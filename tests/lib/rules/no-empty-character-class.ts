import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-empty-character-class"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
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
        String.raw`/a[[[ab]&&b]]/v`,
        String.raw`/a[[ab]&&b]/v`,
    ],
    invalid: [
        {
            code: `/[]/`,
            errors: [
                {
                    message:
                        "This character class matches no characters because it is empty.",
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
                        "This character class matches no characters because it is empty.",
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
                        "This character class matches no characters because it is empty.",
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
                        "This character class matches no characters because it is empty.",
                    line: 1,
                    column: 13,
                },
            ],
        },
        {
            code: String.raw`/[^\s\S]/`,
            errors: ["This character class cannot match any characters."],
        },
        {
            code: String.raw`/[^\da-zA-Z_\W]/`,
            errors: ["This character class cannot match any characters."],
        },
        {
            code: String.raw`/a[[a&&b]]/v`,
            errors: [
                {
                    message:
                        "This character class cannot match any characters.",
                    line: 1,
                    column: 3,
                },
                {
                    message:
                        "This character class cannot match any characters.",
                    line: 1,
                    column: 4,
                },
            ],
        },
        {
            code: String.raw`/a[a&&b]/v`,
            errors: [
                {
                    message:
                        "This character class cannot match any characters.",
                    line: 1,
                    column: 3,
                },
            ],
        },
    ],
})
