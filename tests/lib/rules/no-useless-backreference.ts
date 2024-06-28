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
        "/.(?=(b))\\1/",
        "/(?:(a)|b)\\1/",
        "/(a)?\\1/",
        "/(a)\\1/",
        "/(?=(a))\\w\\1/",
        "/(?!(a)\\1)/",
        // ES2025
        ...(semver.gte(ESLint.version, "9.6.0")
            ? [`/((?<foo>bar)\\k<foo>|(?<foo>baz))/`]
            : []),
    ],
    invalid: [
        "/(b)(\\2a)/",
        "/(a\\1)/",

        "/(\\b)a\\1/",
        "/([\\q{}])a\\1/v",
        "/(\\b|a{0})a\\1/",

        "/(a)b|\\1/",
        "/(?:(a)b|\\1)/",
        "/(?<=(a)b|\\1)/",

        "/\\1(a)/",
        "/(?:\\1(a))+/",

        "/(?<=(a)\\1)b/",

        "/(?!(a))\\w\\1/",
        "/(?!(?!(a)))\\w\\1/",

        // ES2025
        ...(semver.gte(ESLint.version, "9.6.0")
            ? [
                  `/\\k<foo>((?<foo>bar)|(?<foo>baz))/`,
                  `/((?<foo>bar)|\\k<foo>(?<foo>baz))/`,
                  `/\\k<foo>((?<foo>bar)|(?<foo>baz)|(?<foo>qux))/`,
                  `/((?<foo>bar)|\\k<foo>(?<foo>baz)|(?<foo>qux))/`,
                  `/((?<foo>bar)|\\k<foo>|(?<foo>baz))/`,
                  `/((?<foo>bar)|\\k<foo>|(?<foo>baz)|(?<foo>qux))/`,
                  `/((?<foo>bar)|(?<foo>baz\\k<foo>)|(?<foo>qux\\k<foo>))/`,
                  `/(?<=((?<foo>bar)|(?<foo>baz))\\k<foo>)/`,
                  `/((?!(?<foo>bar))|(?!(?<foo>baz)))\\k<foo>/`,
              ]
            : []),
    ],
})
