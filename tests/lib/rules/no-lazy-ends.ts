import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-lazy-ends"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
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
                },
                {
                    message:
                        "The quantifier and the quantified element can be removed because the quantifier is lazy and has a minimum of 0.",
                    line: 6,
                    column: 26,
                },
            ],
        },
    ],
})
