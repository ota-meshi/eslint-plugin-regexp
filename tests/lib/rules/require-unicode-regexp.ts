import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/require-unicode-regexp"

const tester = new SnapshotRuleTester({
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
        String.raw`/foo/`,
        String.raw`/foo/gimy`,
        String.raw`RegExp('foo')`,
        String.raw`RegExp('foo', '')`,
        String.raw`RegExp('foo', 'gimy')`,
        String.raw`new RegExp('foo')`,
        String.raw`new RegExp('foo', '')`,
        String.raw`new RegExp('foo', 'gimy')`,
        String.raw`const flags = 'gi'; new RegExp('foo', flags)`,
        String.raw`const flags = 'gimu'; new RegExp('foo', flags[0])`,

        // Compatibility
        // All of the below cases are only fixable if they are compatible

        String.raw`/❤️/`,
        String.raw`/foo/i`,
        String.raw`/ab+c/`,
        String.raw`/a.*b/`,
        String.raw`/<[^<>]+>/`,
        // "k" maps to 3 characters in ignore-case Unicode mode
        String.raw`/k/i`,
        // Same for \w
        String.raw`/\w/i`,
        // Same for \b
        String.raw`/\bfoo/i`,

        String.raw`/[😃]/`,
        String.raw`/😃+/`,
        String.raw`/\p{Ll}/`,
        // "<😃>" is accepted by one but not the other
        String.raw`/<[^<>]>/`,
    ],
})
