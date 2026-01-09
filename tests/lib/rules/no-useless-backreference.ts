import { ESLint } from "eslint"
import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import semver from "semver"
import rule from "../../../lib/rules/no-useless-backreference"
const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-backreference", rule as any, {
    valid: [
        String.raw`/.(?=(b))\1/`,
        String.raw`/(?:(a)|b)\1/`,
        String.raw`/(a)?\1/`,
        String.raw`/(a)\1/`,
        String.raw`/(?=(a))\w\1/`,
        String.raw`/(?!(a)\1)/`,
        // ES2025
        ...(semver.gte(ESLint.version, "9.6.0")
            ? [String.raw`/((?<foo>bar)\k<foo>|(?<foo>baz))/`]
            : []),
    ],
    invalid: [
        String.raw`/(b)(\2a)/`,
        String.raw`/(a\1)/`,

        String.raw`/(\b)a\1/`,
        String.raw`/([\q{}])a\1/v`,
        String.raw`/(\b|a{0})a\1/`,

        String.raw`/(a)b|\1/`,
        String.raw`/(?:(a)b|\1)/`,
        String.raw`/(?<=(a)b|\1)/`,

        String.raw`/\1(a)/`,
        String.raw`/(?:\1(a))+/`,

        String.raw`/(?<=(a)\1)b/`,

        String.raw`/(?!(a))\w\1/`,
        String.raw`/(?!(?!(a)))\w\1/`,

        // ES2025
        ...(semver.gte(ESLint.version, "9.6.0")
            ? [
                  String.raw`/\k<foo>((?<foo>bar)|(?<foo>baz))/`,
                  String.raw`/((?<foo>bar)|\k<foo>(?<foo>baz))/`,
                  String.raw`/\k<foo>((?<foo>bar)|(?<foo>baz)|(?<foo>qux))/`,
                  String.raw`/((?<foo>bar)|\k<foo>(?<foo>baz)|(?<foo>qux))/`,
                  String.raw`/((?<foo>bar)|\k<foo>|(?<foo>baz))/`,
                  String.raw`/((?<foo>bar)|\k<foo>|(?<foo>baz)|(?<foo>qux))/`,
                  String.raw`/((?<foo>bar)|(?<foo>baz\k<foo>)|(?<foo>qux\k<foo>))/`,
                  String.raw`/(?<=((?<foo>bar)|(?<foo>baz))\k<foo>)/`,
                  String.raw`/((?!(?<foo>bar))|(?!(?<foo>baz)))\k<foo>/`,
              ]
            : []),
    ],
})
