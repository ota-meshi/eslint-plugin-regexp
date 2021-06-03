import type { Rule } from "eslint"
import { RuleTester, Linter } from "eslint"
import assert from "assert"
import rule from "../../../lib/rules/no-useless-flag"
import { rules } from "../../../lib/utils/rules"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-flag", rule as any, {
    valid: [
        // i
        `/foo/i`,
        `/BAR/i`,
        `/\\w\\W/iu`,
        `/\\p{Lu}/i`,
        `/\u212A/iu`,
        `/\\b/iu`,
        String.raw`/\x41/i`,
        `/[a-zA-Z]/i`, // in that case you should use the i flag instead of removing it

        // m
        `/^foo/m`,
        `/foo$/m`,
        `/^foo$/m`,

        // s
        `/./s`,

        // g
        `
        let c = 0
        for (const regex = /foo/g; c<=5; c++) {
            console.log(c, regex.test(''));
        }
        `,
        `
        const regex = /foo/g;
        regex.test(bar);
        regex.test(bar);
        `,
        `
        const regex = /foo/g;
        regex.exec(bar);
        regex.exec(bar);
        `,
        `
        const regex = /foo/g;
        `,
        `
        const regex = /foo/g;
        function fn () {
            return regex.test(bar);
        }
        `,
        `
        const regex = /foo/g;
        while (foo) {
            regex.test(bar);
        }
        `,
        `
        const regex = /foo/g;
        for (;foo;) {
            regex.test(bar);
        }
        `,
        `
        const regex = /foo/g;
        for (const foo of bar) {
            regex.test(bar);
        }
        `,
        `
        const regex = /foo/g;
        for (const foo in bar) {
            regex.test(bar);
        }
        `,
        `
        const regex = /foo/g;
        do {
            regex.test(bar);
        } while (foo)
        `,
        `
        const regex = /foo/g;
        unknown.search(regex)
        'str'.search(regex)
        `,
        `
        const regex = /foo/g;
        unknown(regex)
        'str'.search(regex)
        `,
        `
        const regex = /foo/g;
        regex.split(unknown)
        `,
        `
        const regex = /foo/g;
        unknown.exec(regex)
        `,

        // y
        `
        const regex = /foo/y
        regex.lastIndex = 4
        regex.test('bar_foo')
        `,
        `
        const regex = /foo/y;
        regex.test(bar);
        regex.test(bar);
        `,
        `
        const regex = /foo/y;
        regex.exec(bar);
        regex.exec(bar);
        `,
        `
        const regex = /foo/y;
        `,
        `
        const regex = /foo/y;
        function fn () {
            return regex.test(bar);
        }
        `,
        `
        const regex = /foo/y;
        while (foo) {
            regex.test(bar);
        }
        `,
        `
        const regex = /foo/y;
        for (;foo;) {
            regex.test(bar);
        }
        `,
        `
        const regex = /foo/y;
        for (const foo of bar) {
            regex.test(bar);
        }
        `,
        `
        const regex = /foo/y;
        for (const foo in bar) {
            regex.test(bar);
        }
        `,
        `
        const regex = /foo/y;
        do {
            regex.test(bar);
        } while (foo)
        `,
        `
        const regex = /foo/y;
        unknown.search(regex)
        'str'.search(regex)
        `,
        `
        const regex = /foo/y;
        unknown(regex)
        'str'.search(regex)
        `,
        `
        const regex = /foo/y;
        regex.split(unknown)
        `,
        `
        const regex = /foo/y;
        unknown.exec(regex)
        `,

        // ignore
        { code: String.raw`/\w/i`, options: [{ ignore: ["i"] }] },
        { code: String.raw`/\w/m`, options: [{ ignore: ["m"] }] },
        { code: String.raw`/\w/s`, options: [{ ignore: ["s"] }] },
        { code: `/foo/g.test(string)`, options: [{ ignore: ["g"] }] },
    ],
    invalid: [
        // i
        {
            code: String.raw`/\w \W \s \S \d \D . \b/i`,
            output: String.raw`/\w \W \s \S \d \D . \b/`,
            errors: [
                {
                    message:
                        "The 'i' flag is unnecessary because the pattern only contains case-invariant characters.",
                },
            ],
        },
        {
            code: `/\u212A/i`,
            output: `/\u212A/`,
            errors: [
                {
                    message:
                        "The 'i' flag is unnecessary because the pattern only contains case-invariant characters.",
                },
            ],
        },

        // m
        {
            code: String.raw`/\w/m`,
            output: String.raw`/\w/`,
            errors: [
                {
                    message:
                        "The 'm' flag is unnecessary because the pattern does not contain start (^) or end ($) assertions.",
                },
            ],
        },

        // s
        {
            code: String.raw`/\w/s`,
            output: String.raw`/\w/`,
            errors: [
                {
                    message:
                        "The 's' flag is unnecessary because the pattern does not contain dots (.).",
                },
            ],
        },

        // i & m & s
        {
            code: String.raw`/\w/ims`,
            output: String.raw`/\w/ms`,
            errors: [
                {
                    message:
                        "The 'i' flag is unnecessary because the pattern only contains case-invariant characters.",
                    line: 1,
                    column: 5,
                },
                {
                    message:
                        "The 'm' flag is unnecessary because the pattern does not contain start (^) or end ($) assertions.",
                    line: 1,
                    column: 6,
                },
                {
                    message:
                        "The 's' flag is unnecessary because the pattern does not contain dots (.).",
                    line: 1,
                    column: 7,
                },
            ],
        },
        {
            code: String.raw`/\w/ms`,
            output: String.raw`/\w/s`,
            errors: [
                {
                    message:
                        "The 'm' flag is unnecessary because the pattern does not contain start (^) or end ($) assertions.",
                    line: 1,
                    column: 5,
                },
                {
                    message:
                        "The 's' flag is unnecessary because the pattern does not contain dots (.).",
                    line: 1,
                    column: 6,
                },
            ],
        },

        // g
        {
            code: `
            /* ✓ GOOD */
            const regex1 = /foo/g;
            const str = 'table football, foosball';
            while ((array = regex1.exec(str)) !== null) {
              //
            }

            const regex2 = /foo/g;
            regex2.test(string);
            regex2.test(string);

            str.replace(/foo/g, 'bar');
            str.replaceAll(/foo/g, 'bar');

            /* ✗ BAD */
            /foo/g.test(string);
            const regex3 = /foo/g;
            regex3.test(string); // You have used it only once.

            /foo/g.exec(string);
            const regex4 = /foo/g;
            regex4.exec(string); // You have used it only once.

            new RegExp('foo', 'g').test(string);

            str.search(/foo/g);
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 17,
                    column: 18,
                    endLine: 17,
                    endColumn: 19,
                },
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 18,
                    column: 33,
                    endLine: 18,
                    endColumn: 34,
                },
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 21,
                    column: 18,
                    endLine: 21,
                    endColumn: 19,
                },
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 22,
                    column: 33,
                    endLine: 22,
                    endColumn: 34,
                },
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 25,
                    column: 31,
                    endLine: 25,
                    endColumn: 34,
                },
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 27,
                    column: 29,
                    endLine: 27,
                    endColumn: 30,
                },
            ],
        },
        {
            code: `
            /foo/g.test(bar);
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 2,
                    column: 18,
                },
            ],
        },
        {
            code: `
            /foo/g.exec(bar);
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 2,
                    column: 18,
                },
            ],
        },
        {
            code: `
            new RegExp('foo', 'g').test(bar);
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 2,
                    column: 31,
                },
            ],
        },
        {
            code: `
            "foo foo".search(/foo/g);
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 2,
                    column: 35,
                },
            ],
        },
        {
            code: `
            const regex = /foo/g;
            regex.test(bar);
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 2,
                    column: 32,
                },
            ],
        },
        {
            code: `
            function fn () {
                const regex = /foo/g;
                return regex.test(bar);
            }
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 3,
                    column: 36,
                },
            ],
        },
        {
            code: `
            const a = /foo/g;
            const b = a;
            const regex = b;

            regex.test(bar);

            'str'.split(b)
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because not using global testing.",
                    line: 2,
                    column: 28,
                },
            ],
        },

        // y
        {
            code: `
            /* ✓ GOOD */
            const regex1 = /foo/y;
            const str = 'table football, foosball';
            regex1.lastIndex = 6
            var array = regex1.exec(str)
            
            const regex2 = /foo/y;
            regex2.test(string);
            regex2.test(string);
            
            str.replace(/foo/y, 'bar');
            str.replaceAll(/foo/gy, 'bar');

            const regexp3 = /foo/y
            str.search(regexp3)
            
            /* ✗ BAD */
            str.split(/foo/y);
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'y' flag is unnecessary because not using sticky search.",
                    line: 19,
                    column: 28,
                },
            ],
        },
        {
            code: `
            "str".split(/foo/y)
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'y' flag is unnecessary because not using sticky search.",
                    line: 2,
                    column: 30,
                },
            ],
        },
        {
            code: `
            "str".split(new RegExp('foo', 'y'));
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'y' flag is unnecessary because not using sticky search.",
                    line: 2,
                    column: 43,
                },
            ],
        },
        {
            code: `
            const a = /foo/y;
            const b = a;
            const regex = b;

            'str'.split(b)
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'y' flag is unnecessary because not using sticky search.",
                    line: 2,
                    column: 28,
                },
            ],
        },
    ],
})

// Check that autofix of rules does not conflict.
describe("Don't conflict even if using the rules together.", () => {
    type RulesConfig = Exclude<Linter.Config["rules"], undefined>
    const testCases: {
        code: string
        rulesConfig: RulesConfig
        output: string
        messages: {
            ruleId: string
            message: string
        }[]
        messagesAfterFix: {
            ruleId: string
            message: string
        }[]
    }[] = [
        {
            code: String.raw`/[\s\S]*/s;`,
            output: String.raw`/[\s\S]*/;`,
            rulesConfig: {
                "regexp/no-useless-flag": ["error"],
                "regexp/match-any": ["error", { allows: ["dotAll"] }],
            },
            messages: [
                {
                    ruleId: "regexp/match-any",
                    message:
                        "Unexpected using '[\\s\\S]' to match any character.",
                },
                {
                    ruleId: "regexp/no-useless-flag",
                    message:
                        "The 's' flag is unnecessary because the pattern does not contain dots (.).",
                },
            ],
            messagesAfterFix: [
                {
                    ruleId: "regexp/match-any",
                    message:
                        "Unexpected using '[\\s\\S]' to match any character.",
                },
            ],
        },
        {
            code: String.raw`/[\s\S]*/s;`,
            output: String.raw`/[\s\S]*/;`,
            rulesConfig: {
                "regexp/match-any": ["error", { allows: ["dotAll"] }],
                "regexp/no-useless-flag": ["error"],
            },
            messages: [
                {
                    ruleId: "regexp/match-any",
                    message:
                        "Unexpected using '[\\s\\S]' to match any character.",
                },
                {
                    ruleId: "regexp/no-useless-flag",
                    message:
                        "The 's' flag is unnecessary because the pattern does not contain dots (.).",
                },
            ],
            messagesAfterFix: [
                {
                    ruleId: "regexp/match-any",
                    message:
                        "Unexpected using '[\\s\\S]' to match any character.",
                },
            ],
        },
    ]

    const linter = new Linter()
    const configAllRules = rules.reduce((p, r) => {
        p[r.meta.docs.ruleId] = "error"
        return p
    }, {} as Exclude<Linter.Config["rules"], undefined>)
    linter.defineRules(
        rules.reduce((p, r) => {
            p[r.meta.docs.ruleId] = r
            return p
        }, {} as { [name: string]: Rule.RuleModule }),
    )
    for (const {
        code,
        output,
        rulesConfig,
        messages,
        messagesAfterFix,
    } of testCases) {
        it(code, () => {
            const config: Linter.Config = {
                parserOptions: {
                    ecmaVersion: 2020,
                    sourceType: "module",
                },
                rules: {
                    ...configAllRules,
                    ...rulesConfig,
                },
            }

            const result = linter.verify(code, config, "test.js")
            assert.deepStrictEqual(
                result.map((m) => ({
                    ruleId: m.ruleId,
                    message: m.message,
                })),
                messages,
            )

            const resultFix = linter.verifyAndFix(code, config, "test.js")

            assert.strictEqual(resultFix.output, output)

            assert.deepStrictEqual(
                resultFix.messages.map((m) => ({
                    ruleId: m.ruleId,
                    message: m.message,
                })),
                messagesAfterFix,
            )
        })
    }
})
