import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/require-unicode-regexp"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        globals: {
            globalThis: "off",
        },
    },
})

tester.run("require-unicode-regexp", rule as any, {
    valid: [
        String.raw`/foo/u`,
        String.raw`/foo/gimuy`,
        String.raw`RegExp('', 'u')`,
        String.raw`new RegExp('', 'u')`,
        String.raw`RegExp('', 'gimuy')`,
        String.raw`new RegExp('', 'gimuy')`,
        String.raw`const flags = 'u'; new RegExp('', flags)`,
        String.raw`const flags = 'g'; new RegExp('', flags + 'u')`,
        String.raw`const flags = 'gimu'; new RegExp('foo', flags[3])`,
        String.raw`new RegExp('', flags)`,
        String.raw`function f(flags) { return new RegExp('', flags) }`,
        String.raw`function f(RegExp) { return new RegExp('foo') }`,
        String.raw`new globalThis.RegExp('foo')`,
        String.raw`new globalThis.RegExp('foo', 'u')`,
        String.raw`globalThis.RegExp('foo', 'u')`,
        String.raw`const flags = 'u'; new globalThis.RegExp('', flags)`,
        String.raw`const flags = 'g'; new globalThis.RegExp('', flags + 'u')`,
        String.raw`const flags = 'gimu'; new globalThis.RegExp('foo', flags[3])`,
        String.raw`/foo/v`,
        String.raw`new RegExp('foo', 'v')`,
    ],
    invalid: [
        {
            code: String.raw`/foo/`,
            output: String.raw`/foo/u`,
            errors: [{ messageId: "require" }],
        },
        {
            code: String.raw`/foo/gimy`,
            output: String.raw`/foo/gimyu`,
            errors: [{ messageId: "require" }],
        },
        {
            code: String.raw`RegExp('foo')`,
            output: String.raw`RegExp('foo', "u")`,
            errors: [{ messageId: "require" }],
        },
        {
            code: String.raw`RegExp('foo', '')`,
            output: String.raw`RegExp('foo', 'u')`,
            errors: [{ messageId: "require" }],
        },
        {
            code: String.raw`RegExp('foo', 'gimy')`,
            output: String.raw`RegExp('foo', 'gimyu')`,
            errors: [{ messageId: "require" }],
        },
        {
            code: String.raw`new RegExp('foo')`,
            output: String.raw`new RegExp('foo', "u")`,
            errors: [{ messageId: "require" }],
        },
        {
            code: String.raw`new RegExp('foo', '')`,
            output: String.raw`new RegExp('foo', 'u')`,
            errors: [{ messageId: "require" }],
        },
        {
            code: String.raw`new RegExp('foo', 'gimy')`,
            output: String.raw`new RegExp('foo', 'gimyu')`,
            errors: [{ messageId: "require" }],
        },
        {
            code: String.raw`const flags = 'gi'; new RegExp('foo', flags)`,
            output: String.raw`const flags = 'giu'; new RegExp('foo', flags)`,
            errors: [{ messageId: "require" }],
        },
        {
            code: String.raw`const flags = 'gimu'; new RegExp('foo', flags[0])`,
            output: null,
            errors: [{ messageId: "require" }],
        },

        // Compatibility
        // All of the below cases are only fixable if they are compatible

        {
            code: String.raw`/foo/`,
            output: String.raw`/foo/u`,
            errors: 1,
        },
        {
            code: String.raw`/❤️/`,
            output: String.raw`/❤️/u`,
            errors: 1,
        },
        {
            code: String.raw`/foo/i`,
            output: String.raw`/foo/iu`,
            errors: 1,
        },
        {
            code: String.raw`/ab+c/`,
            output: String.raw`/ab+c/u`,
            errors: 1,
        },
        {
            code: String.raw`/a.*b/`,
            output: String.raw`/a.*b/u`,
            errors: 1,
        },
        {
            code: String.raw`/<[^<>]+>/`,
            output: String.raw`/<[^<>]+>/u`,
            errors: 1,
        },
        {
            // "k" maps to 3 characters in ignore-case Unicode mode
            code: String.raw`/k/i`,
            output: null,
            errors: 1,
        },
        {
            // Same for \w
            code: String.raw`/\w/i`,
            output: null,
            errors: 1,
        },
        {
            // Same for \b
            code: String.raw`/\bfoo/i`,
            output: null,
            errors: 1,
        },
        {
            code: String.raw`/[😃]/`,
            output: null,
            errors: 1,
        },
        {
            code: String.raw`/😃+/`,
            output: null,
            errors: 1,
        },
        {
            code: String.raw`/\p{Ll}/`,
            output: null,
            errors: 1,
        },
        {
            // "<😃>" is accepted by one but not the other
            code: String.raw`/<[^<>]>/`,
            output: null,
            errors: 1,
        },
    ],
})
