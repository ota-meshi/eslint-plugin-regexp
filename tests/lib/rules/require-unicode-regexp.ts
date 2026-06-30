import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/require-unicode-regexp.ts"

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
        "/foo/u",
        "/foo/gimuy",
        "RegExp('', 'u')",
        "new RegExp('', 'u')",
        "RegExp('', 'gimuy')",
        "new RegExp('', 'gimuy')",
        "const flags = 'u'; new RegExp('', flags)",
        "const flags = 'g'; new RegExp('', flags + 'u')",
        "const flags = 'gimu'; new RegExp('foo', flags[3])",
        "new RegExp('', flags)",
        "function f(flags) { return new RegExp('', flags) }",
        "function f(RegExp) { return new RegExp('foo') }",
        "new globalThis.RegExp('foo')",
        "new globalThis.RegExp('foo', 'u')",
        "globalThis.RegExp('foo', 'u')",
        "const flags = 'u'; new globalThis.RegExp('', flags)",
        "const flags = 'g'; new globalThis.RegExp('', flags + 'u')",
        "const flags = 'gimu'; new globalThis.RegExp('foo', flags[3])",
        "/foo/v",
        "new RegExp('foo', 'v')",
    ],
    invalid: [
        "/foo/",
        "/foo/gimy",
        "RegExp('foo')",
        "RegExp('foo', '')",
        "RegExp('foo', 'gimy')",
        "new RegExp('foo')",
        "new RegExp('foo', '')",
        "new RegExp('foo', 'gimy')",
        "const flags = 'gi'; new RegExp('foo', flags)",
        "const flags = 'gimu'; new RegExp('foo', flags[0])",

        // Compatibility
        // All of the below cases are only fixable if they are compatible

        "/❤️/",
        "/foo/i",
        "/ab+c/",
        "/a.*b/",
        "/<[^<>]+>/",
        // "k" maps to 3 characters in ignore-case Unicode mode
        "/k/i",
        // Same for \w
        String.raw`/\w/i`,
        // Same for \b
        String.raw`/\bfoo/i`,

        "/[😃]/",
        "/😃+/",
        String.raw`/\p{Ll}/`,
        // "<😃>" is accepted by one but not the other
        "/<[^<>]>/",
    ],
})
