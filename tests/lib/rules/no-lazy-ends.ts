import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-lazy-ends"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-lazy-ends", rule as any, {
    valid: [
        `/a+?b*/.test(str)`,
        `/a??(?:ba+?|c)*/.test(str)`,
        `/ba*?$/.test(str)`,
        `/a??/`, // UsageOfPattern.unknown

        `/a{3}?/.test(str)`, // uselessly lazy but that's not for this rule to correct

        // exported
        {
            code: `
            /* exported a */
            const a = /a??/
            a.test(str)`,
            languageOptions: {
                ecmaVersion: 2020,
                sourceType: "script",
            },
        },

        String.raw`/[\q{ab}]?/v.test(str)`,
    ],
    invalid: [
        {
            code: `/a??/.test(str)`,
            errors: [
                {
                    message:
                        "The quantifier and the quantified element can be removed because the quantifier is lazy and has a minimum of 0.",
                    line: 1,
                    column: 2,
                    suggestions: [
                        {
                            messageId: "suggestRemoveElement",
                            output: `/(?:)/.test(str)`,
                        },
                        {
                            messageId: "suggestMakeGreedy",
                            output: `/a?/.test(str)`,
                        },
                    ],
                },
            ],
        },
        {
            code: `/a*?/.test(str)`,
            errors: [
                {
                    message:
                        "The quantifier and the quantified element can be removed because the quantifier is lazy and has a minimum of 0.",
                    line: 1,
                    column: 2,
                    suggestions: [
                        {
                            messageId: "suggestRemoveElement",
                            output: `/(?:)/.test(str)`,
                        },
                        {
                            messageId: "suggestMakeGreedy",
                            output: `/a*/.test(str)`,
                        },
                    ],
                },
            ],
        },
        {
            code: `/a+?/.test(str)`,
            errors: [
                {
                    message:
                        "The quantifier can be removed because the quantifier is lazy and has a minimum of 1.",
                    line: 1,
                    column: 2,
                    suggestions: [
                        {
                            messageId: "suggestRemoveQuantifier",
                            output: `/a/.test(str)`,
                        },
                        {
                            messageId: "suggestMakeGreedy",
                            output: `/a+/.test(str)`,
                        },
                    ],
                },
            ],
        },
        {
            code: `/a{3,7}?/.test(str)`,
            errors: [
                {
                    message:
                        "The quantifier can be replaced with '{3}' because the quantifier is lazy and has a minimum of 3.",
                    line: 1,
                    column: 2,
                    suggestions: [
                        {
                            messageId: "suggestRange",
                            output: `/a{3}/.test(str)`,
                        },
                        {
                            messageId: "suggestMakeGreedy",
                            output: `/a{3,7}/.test(str)`,
                        },
                    ],
                },
            ],
        },
        {
            code: `/a{3,}?/.test(str)`,
            errors: [
                {
                    message:
                        "The quantifier can be replaced with '{3}' because the quantifier is lazy and has a minimum of 3.",
                    line: 1,
                    column: 2,
                    suggestions: [
                        {
                            messageId: "suggestRange",
                            output: `/a{3}/.test(str)`,
                        },
                        {
                            messageId: "suggestMakeGreedy",
                            output: `/a{3,}/.test(str)`,
                        },
                    ],
                },
            ],
        },

        {
            code: `/(?:a|b(c+?))/.test(str)`,
            errors: [
                {
                    message:
                        "The quantifier can be removed because the quantifier is lazy and has a minimum of 1.",
                    line: 1,
                    column: 9,
                    suggestions: [
                        {
                            messageId: "suggestRemoveQuantifier",
                            output: `/(?:a|b(c))/.test(str)`,
                        },
                        {
                            messageId: "suggestMakeGreedy",
                            output: `/(?:a|b(c+))/.test(str)`,
                        },
                    ],
                },
            ],
        },
        {
            code: `/a(?:c|ab+?)?/.test(str)`,
            errors: [
                {
                    message:
                        "The quantifier can be removed because the quantifier is lazy and has a minimum of 1.",
                    line: 1,
                    column: 9,
                    suggestions: [
                        {
                            messageId: "suggestRemoveQuantifier",
                            output: `/a(?:c|ab)?/.test(str)`,
                        },
                        {
                            messageId: "suggestMakeGreedy",
                            output: `/a(?:c|ab+)?/.test(str)`,
                        },
                    ],
                },
            ],
        },
        {
            code: `
            /* ✓ GOOD */
            const any = /[\\s\\S]*?/.source;
            const pattern = RegExp(\`<script(\\\\s\${any})?>(\${any})<\\/script>\`, "g");

            /* ✗ BAD */
            const foo = /[\\s\\S]*?/
            foo.exec(str)
            `,
            errors: [
                {
                    message:
                        "The quantifier and the quantified element can be removed because the quantifier is lazy and has a minimum of 0.",
                    line: 7,
                    column: 26,
                    suggestions: [
                        {
                            messageId: "suggestRemoveElement",
                            output: `
            /* ✓ GOOD */
            const any = /[\\s\\S]*?/.source;
            const pattern = RegExp(\`<script(\\\\s\${any})?>(\${any})<\\/script>\`, "g");

            /* ✗ BAD */
            const foo = /(?:)/
            foo.exec(str)
            `,
                        },
                        {
                            messageId: "suggestMakeGreedy",
                            output: `
            /* ✓ GOOD */
            const any = /[\\s\\S]*?/.source;
            const pattern = RegExp(\`<script(\\\\s\${any})?>(\${any})<\\/script>\`, "g");

            /* ✗ BAD */
            const foo = /[\\s\\S]*/
            foo.exec(str)
            `,
                        },
                    ],
                },
            ],
        },
        {
            code: `
            /* ✓ GOOD */
            const any = /[\\s\\S]*?/.source;
            const pattern = RegExp(\`<script(\\\\s\${any})?>(\${any})<\\/script>\`, "g");

            /* ✗ BAD */
            const foo = /[\\s\\S]*?/
            foo.exec(str)
            `,
            options: [{ ignorePartial: true }],
            errors: [
                {
                    message:
                        "The quantifier and the quantified element can be removed because the quantifier is lazy and has a minimum of 0.",
                    line: 7,
                    column: 26,
                    suggestions: [
                        {
                            messageId: "suggestRemoveElement",
                            output: `
            /* ✓ GOOD */
            const any = /[\\s\\S]*?/.source;
            const pattern = RegExp(\`<script(\\\\s\${any})?>(\${any})<\\/script>\`, "g");

            /* ✗ BAD */
            const foo = /(?:)/
            foo.exec(str)
            `,
                        },
                        {
                            messageId: "suggestMakeGreedy",
                            output: `
            /* ✓ GOOD */
            const any = /[\\s\\S]*?/.source;
            const pattern = RegExp(\`<script(\\\\s\${any})?>(\${any})<\\/script>\`, "g");

            /* ✗ BAD */
            const foo = /[\\s\\S]*/
            foo.exec(str)
            `,
                        },
                    ],
                },
            ],
        },
        {
            code: `
            /* ✗ BAD */
            const any = /[\\s\\S]*?/.source;
            const pattern = RegExp(\`<script(\\\\s\${any})?>(\${any})<\\/script>\`, "g");

            const foo = /[\\s\\S]*?/
            foo.exec(str)
            `,
            options: [{ ignorePartial: false }],
            errors: [
                {
                    message:
                        "The quantifier and the quantified element can be removed because the quantifier is lazy and has a minimum of 0.",
                    line: 3,
                    column: 26,
                    suggestions: [
                        {
                            messageId: "suggestRemoveElement",
                            output: `
            /* ✗ BAD */
            const any = /(?:)/.source;
            const pattern = RegExp(\`<script(\\\\s\${any})?>(\${any})<\\/script>\`, "g");

            const foo = /[\\s\\S]*?/
            foo.exec(str)
            `,
                        },
                        {
                            messageId: "suggestMakeGreedy",
                            output: `
            /* ✗ BAD */
            const any = /[\\s\\S]*/.source;
            const pattern = RegExp(\`<script(\\\\s\${any})?>(\${any})<\\/script>\`, "g");

            const foo = /[\\s\\S]*?/
            foo.exec(str)
            `,
                        },
                    ],
                },
                {
                    message:
                        "The quantifier and the quantified element can be removed because the quantifier is lazy and has a minimum of 0.",
                    line: 6,
                    column: 26,
                    suggestions: [
                        {
                            messageId: "suggestRemoveElement",
                            output: `
            /* ✗ BAD */
            const any = /[\\s\\S]*?/.source;
            const pattern = RegExp(\`<script(\\\\s\${any})?>(\${any})<\\/script>\`, "g");

            const foo = /(?:)/
            foo.exec(str)
            `,
                        },
                        {
                            messageId: "suggestMakeGreedy",
                            output: `
            /* ✗ BAD */
            const any = /[\\s\\S]*?/.source;
            const pattern = RegExp(\`<script(\\\\s\${any})?>(\${any})<\\/script>\`, "g");

            const foo = /[\\s\\S]*/
            foo.exec(str)
            `,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/[\q{ab|}]??/v.test(str)`,
            errors: [
                {
                    message:
                        "The quantifier and the quantified element can be removed because the quantifier is lazy and has a minimum of 0.",
                    line: 1,
                    column: 2,
                    suggestions: [
                        {
                            messageId: "suggestRemoveElement",
                            output: `/(?:)/v.test(str)`,
                        },
                        {
                            messageId: "suggestMakeGreedy",
                            output: String.raw`/[\q{ab|}]?/v.test(str)`,
                        },
                    ],
                },
            ],
        },
    ],
})
