import type { Rule } from "eslint"
import { Linter } from "eslint"
import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import assert from "assert"
import rule from "../../../lib/rules/no-useless-flag"
import { rules } from "../../../lib/utils/rules"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
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
            languageOptions: {
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
        String.raw`/a/u`,
        String.raw`/a/v`,
    ],
    invalid: [
        // i
        String.raw`/\w \W \s \S \d \D . \b/i`,
        `/\u212A/i`,

        // m
        String.raw`/\w/m`,

        // s
        String.raw`/\w/s`,

        // i & m & s
        String.raw`/\w/ims`,
        String.raw`/\w/ms`,

        // g
        `
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
        `
            /foo/g.test(bar);
            `,
        `
            /foo/g.exec(bar);
            `,
        `
            new RegExp('foo', 'g').test(bar);
            `,
        `
            "foo foo".search(/foo/g);
            `,
        `
            const regex = /foo/g;
            regex.test(bar);
            `,
        `
            function fn () {
                const regex = /foo/g;
                return regex.test(bar);
            }
            `,
        `
            const a = /foo/g;
            const b = a;
            const regex = b;

            regex.test(bar);

            'str'.split(b)
            `,
        `
            const a = /foo/g;
            'str'.split(a)
            `,
        `
            const a = /foo/g;
            'str'.split(a)
            'str'.split(a)
            `,
        {
            code: `
            const notStr = {}
            notStr.split(/foo/g);

            maybeStr.split(/foo/g);
            `,
            options: [{ strictTypes: false }],
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
            options: [{ strictTypes: false }],
        },

        // y
        `
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
        `
            "str".split(/foo/y)
            `,
        `
            "str".split(new RegExp('foo', 'y'));
            `,
        `
            const a = /foo/y;
            const b = a;
            const regex = b;

            'str'.split(regex)
            `,
        {
            code: `
            const notStr = {}
            notStr.split(/foo/y);

            maybeStr.split(/foo/y);
            `,
            options: [{ strictTypes: false }],
        },

        // test for RegExp constructor with RegExp arguments
        String.raw`
            const orig = /\w/i; // eslint-disable-line
            const clone = new RegExp(orig, 'i');
            `,
        String.raw`
            const orig = /\w/iy;
            const clone = new RegExp(orig, '');
            `,
        String.raw`
            const orig = /\w/i;
            const clone = new RegExp(orig);
            `,
        String.raw`RegExp(/\w/i);`,
        String.raw`
            const orig = /\w/;
            const clone = new RegExp(orig, 'i');
            `,
        String.raw`RegExp(/\w/imu.source);`,
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
                "regexp/require-unicode-sets-regexp": "off",
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
                "regexp/require-unicode-sets-regexp": "off",
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

    const linter = new Linter({ configType: "flat" })
    const configAllRules = rules.reduce(
        (p, r) => {
            p[r.meta.docs.ruleId] = "error"
            return p
        },
        {} as Exclude<Linter.Config["rules"], undefined>,
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
                languageOptions: {
                    ecmaVersion: 2020,
                    sourceType: "module",
                },
                plugins: {
                    // @ts-expect-error -- ignore type error for eslint v9
                    regexp: {
                        rules: rules.reduce(
                            (p, r) => {
                                p[r.meta.docs.ruleName] = r
                                return p
                            },
                            {} as { [name: string]: Rule.RuleModule },
                        ),
                    },
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
