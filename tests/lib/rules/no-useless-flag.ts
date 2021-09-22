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
        `/\\p{Ll}/iu`,

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
        `
        const notStr = {}
        notStr.split(/foo/g);

        maybeStr.split(/foo/g);
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
        {
            // exported
            code: `
            /* exported b */
            const a = /foo/y;
            const b = a;
            const regex = b;

            'str'.split(regex)
            `,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "script",
            },
        },
        `
        const a = /foo/y;
        const b = a;
        const regex = b; // unused

        'str'.split(b)
        `,

        // ignore
        { code: String.raw`/\w/i`, options: [{ ignore: ["i"] }] },
        { code: String.raw`/\w/m`, options: [{ ignore: ["m"] }] },
        { code: String.raw`/\w/s`, options: [{ ignore: ["s"] }] },
        { code: `/foo/g.test(string)`, options: [{ ignore: ["g"] }] },
        String.raw`
        const orig = /\w/i; // eslint-disable-line
        const clone = new RegExp(orig);
        `,
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
            output: `
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
            /foo/.test(string);
            const regex3 = /foo/g;
            regex3.test(string); // You have used it only once.

            /foo/.exec(string);
            const regex4 = /foo/g;
            regex4.exec(string); // You have used it only once.

            new RegExp('foo', '').test(string);

            str.search(/foo/);
            `,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because the regex is used only once in 'RegExp.prototype.test'.",
                    line: 17,
                    column: 18,
                    endLine: 17,
                    endColumn: 19,
                },
                {
                    message:
                        "The 'g' flag is unnecessary because the regex is used only once in 'RegExp.prototype.test'.",
                    line: 18,
                    column: 33,
                    endLine: 18,
                    endColumn: 34,
                },
                {
                    message:
                        "The 'g' flag is unnecessary because the regex is used only once in 'RegExp.prototype.exec'.",
                    line: 21,
                    column: 18,
                    endLine: 21,
                    endColumn: 19,
                },
                {
                    message:
                        "The 'g' flag is unnecessary because the regex is used only once in 'RegExp.prototype.exec'.",
                    line: 22,
                    column: 33,
                    endLine: 22,
                    endColumn: 34,
                },
                {
                    message:
                        "The 'g' flag is unnecessary because the regex is used only once in 'RegExp.prototype.test'.",
                    line: 25,
                    column: 32,
                    endLine: 25,
                    endColumn: 33,
                },
                {
                    message:
                        "The 'g' flag is unnecessary because 'String.prototype.search' ignores the 'g' flag.",
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
            output: `
            /foo/.test(bar);
            `,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because the regex is used only once in 'RegExp.prototype.test'.",
                    line: 2,
                    column: 18,
                },
            ],
        },
        {
            code: `
            /foo/g.exec(bar);
            `,
            output: `
            /foo/.exec(bar);
            `,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because the regex is used only once in 'RegExp.prototype.exec'.",
                    line: 2,
                    column: 18,
                },
            ],
        },
        {
            code: `
            new RegExp('foo', 'g').test(bar);
            `,
            output: `
            new RegExp('foo', '').test(bar);
            `,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because the regex is used only once in 'RegExp.prototype.test'.",
                    line: 2,
                    column: 32,
                },
            ],
        },
        {
            code: `
            "foo foo".search(/foo/g);
            `,
            output: `
            "foo foo".search(/foo/);
            `,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because 'String.prototype.search' ignores the 'g' flag.",
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
                        "The 'g' flag is unnecessary because the regex is used only once in 'RegExp.prototype.test'.",
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
                        "The 'g' flag is unnecessary because the regex is used only once in 'RegExp.prototype.test'.",
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
                        "The 'g' flag is unnecessary because the regex does not use global search.",
                    line: 2,
                    column: 28,
                },
            ],
        },
        {
            code: `
            const a = /foo/g;
            'str'.split(a)
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flag is unnecessary because 'String.prototype.split' ignores the 'g' flag.",
                    line: 2,
                    column: 28,
                },
            ],
        },
        {
            code: `
            const a = /foo/g;
            'str'.split(a)
            'str'.split(a)
            `,
            output: null,
            errors: [
                "The 'g' flag is unnecessary because 'String.prototype.split' ignores the 'g' flag.",
            ],
        },
        {
            code: `
            const notStr = {}
            notStr.split(/foo/g);

            maybeStr.split(/foo/g);
            `,
            output: `
            const notStr = {}
            notStr.split(/foo/g);

            maybeStr.split(/foo/);
            `,
            options: [{ strictTypes: false }],
            errors: [
                "The 'g' flag is unnecessary because 'String.prototype.split' ignores the 'g' flag.",
            ],
        },
        {
            code: `
            /** @param {object} obj */
            function fn1 (obj) {
                obj.search(/foo/g);
            }
            function fn2 (maybeStr) {
                maybeStr.split(/foo/g);
            }
            `,
            output: `
            /** @param {object} obj */
            function fn1 (obj) {
                obj.search(/foo/g);
            }
            function fn2 (maybeStr) {
                maybeStr.split(/foo/);
            }
            `,
            options: [{ strictTypes: false }],
            errors: [
                "The 'g' flag is unnecessary because 'String.prototype.split' ignores the 'g' flag.",
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
            output: `
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
            str.split(/foo/);
            `,
            errors: [
                {
                    message:
                        "The 'y' flag is unnecessary because 'String.prototype.split' ignores the 'y' flag.",
                    line: 19,
                    column: 28,
                },
            ],
        },
        {
            code: `
            "str".split(/foo/y)
            `,
            output: `
            "str".split(/foo/)
            `,
            errors: [
                {
                    message:
                        "The 'y' flag is unnecessary because 'String.prototype.split' ignores the 'y' flag.",
                    line: 2,
                    column: 30,
                },
            ],
        },
        {
            code: `
            "str".split(new RegExp('foo', 'y'));
            `,
            output: `
            "str".split(new RegExp('foo', ''));
            `,
            errors: [
                {
                    message:
                        "The 'y' flag is unnecessary because 'String.prototype.split' ignores the 'y' flag.",
                    line: 2,
                    column: 44,
                },
            ],
        },
        {
            code: `
            const a = /foo/y;
            const b = a;
            const regex = b;

            'str'.split(regex)
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'y' flag is unnecessary because 'String.prototype.split' ignores the 'y' flag.",
                    line: 2,
                    column: 28,
                },
            ],
        },
        {
            code: `
            const notStr = {}
            notStr.split(/foo/y);

            maybeStr.split(/foo/y);
            `,
            output: `
            const notStr = {}
            notStr.split(/foo/y);

            maybeStr.split(/foo/);
            `,
            options: [{ strictTypes: false }],
            errors: [
                "The 'y' flag is unnecessary because 'String.prototype.split' ignores the 'y' flag.",
            ],
        },

        // test for RegExp constructor with RegExp arguments
        {
            code: String.raw`
            const orig = /\w/i; // eslint-disable-line
            const clone = new RegExp(orig, 'i');
            `,
            output: String.raw`
            const orig = /\w/i; // eslint-disable-line
            const clone = new RegExp(orig, '');
            `,
            errors: [
                {
                    message:
                        "The 'i' flag is unnecessary because the pattern only contains case-invariant characters.",
                    line: 3,
                    column: 45,
                },
            ],
        },
        {
            code: String.raw`
            const orig = /\w/iy;
            const clone = new RegExp(orig, '');
            `,
            output: String.raw`
            const orig = /\w/;
            const clone = new RegExp(orig, '');
            `,
            errors: [
                {
                    message:
                        "The flags of this RegExp literal are useless because only the source of the regex is used.",
                    line: 2,
                    column: 30,
                },
            ],
        },
        {
            code: String.raw`
            const orig = /\w/i;
            const clone = new RegExp(orig);
            `,
            output: String.raw`
            const orig = /\w/;
            const clone = new RegExp(orig);
            `,
            errors: [
                {
                    message:
                        "The 'i' flag is unnecessary because the pattern only contains case-invariant characters.",
                    line: 2,
                    column: 30,
                },
            ],
        },
        {
            code: String.raw`RegExp(/\w/i);`,
            output: String.raw`RegExp(/\w/);`,
            errors: [
                {
                    message:
                        "The 'i' flag is unnecessary because the pattern only contains case-invariant characters.",
                    line: 1,
                    column: 12,
                },
            ],
        },
        {
            code: String.raw`
            const orig = /\w/;
            const clone = new RegExp(orig, 'i');
            `,
            output: String.raw`
            const orig = /\w/;
            const clone = new RegExp(orig, '');
            `,
            errors: [
                {
                    message:
                        "The 'i' flag is unnecessary because the pattern only contains case-invariant characters.",
                    line: 3,
                    column: 45,
                },
            ],
        },
        {
            code: String.raw`RegExp(/\w/imu.source);`,
            output: String.raw`RegExp(/\w/u.source);`,
            errors: [
                {
                    message:
                        "The flags of this RegExp literal are useless because only the source of the regex is used.",
                    line: 1,
                    column: 12,
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
                "regexp/require-unicode-regexp": "off",
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
                "regexp/require-unicode-regexp": "off",
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
