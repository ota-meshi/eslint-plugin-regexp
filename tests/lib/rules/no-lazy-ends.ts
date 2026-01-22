import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-lazy-ends.ts"

const tester = new SnapshotRuleTester({
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
        `/a??/.test(str)`,
        `/a*?/.test(str)`,
        `/a+?/.test(str)`,
        `/a{3,7}?/.test(str)`,
        `/a{3,}?/.test(str)`,

        `/(?:a|b(c+?))/.test(str)`,
        `/a(?:c|ab+?)?/.test(str)`,
        `
            /* ✓ GOOD */
            const any = /[\\s\\S]*?/.source;
            const pattern = RegExp(\`<script(\\\\s\${any})?>(\${any})<\\/script>\`, "g");

            /* ✗ BAD */
            const foo = /[\\s\\S]*?/
            foo.exec(str)
            `,
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
        },
        String.raw`/[\q{ab|}]??/v.test(str)`,
    ],
})
