import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-escape-replacement-dollar-char"

const tester = new RuleTester({
    parserOptions: {
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
    ],
    invalid: [
        {
            code: `'€1,234'.replace(/€/, '$'); // "$1,234"`,
            errors: [
                {
                    message:
                        "Unexpected replacement `$` character without escaping. Use `$$` instead.",
                    line: 1,
                    column: 24,
                    endLine: 1,
                    endColumn: 25,
                },
            ],
        },
        {
            code: `'€1,234'.replace(/€/v, '$'); // "$1,234"`,
            errors: 1,
        },
        {
            code: `'€1,234'.replaceAll(/€/, '$'); // "$1,234"`,
            errors: [
                "Unexpected replacement `$` character without escaping. Use `$$` instead.",
            ],
        },
        {
            code: `'abc'.replace(/./, '$ $$ $');`,
            errors: [
                {
                    message:
                        "Unexpected replacement `$` character without escaping. Use `$$` instead.",
                    line: 1,
                    column: 21,
                },
                {
                    message:
                        "Unexpected replacement `$` character without escaping. Use `$$` instead.",
                    line: 1,
                    column: 26,
                },
            ],
        },
        {
            code: `'abc'.replace(/(?<foo>.)/, '$<foo');`,
            errors: [
                "Unexpected replacement `$` character without escaping. Use `$$` instead.",
            ],
        },
    ],
})
