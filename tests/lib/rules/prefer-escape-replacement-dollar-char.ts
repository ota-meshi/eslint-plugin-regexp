import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-escape-replacement-dollar-char"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-escape-replacement-dollar-char", rule as any, {
    valid: [
        `'€1,234'.replace(/€/, '$$'); // "$1,234"`,
        `'abc'.foo(/./, '$');`,
        `'abc'.replace(/./, $);`,
        `'abc'.replace(foo, '$');`,
        `foo.replace(/./, '$');`,
        `'abc'.replace(/./, '$&$&');`,
        `'abc'.replace(/./, "$\`$'");`,
        `'abc'.replace(/(.)/, '$1');`,
        `'abc'.replace(/(?<foo>.)/, '$<foo>');`,
        String.raw`'€1,234'.replace(/[\q{€}]/v, '$$'); // "$1,234"`,
    ],
    invalid: [
        `'€1,234'.replace(/€/, '$'); // "$1,234"`,
        `'€1,234'.replace(/€/v, '$'); // "$1,234"`,
        `'€1,234'.replaceAll(/€/, '$'); // "$1,234"`,
        `'abc'.replace(/./, '$ $$ $');`,
        `'abc'.replace(/(?<foo>.)/, '$<foo');`,
        String.raw`'€1,234'.replace(/[\q{€}]/v, '$'); // "$1,234"`,
    ],
})
