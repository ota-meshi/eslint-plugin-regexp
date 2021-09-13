import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-lookaround"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-lookaround", rule as any, {
    valid: [
        `const str = 'I love unicorn! I hate unicorn?'.replace(/(?<=love )unicorn(?=!)/, '🦄');`,
        `const str = 'A JavaScript linter written in JavaScript.'.replaceAll(/Java(?=Script)/g, 'Type');`,
        `const str = 'A JavaScript formatter written in JavaScript.'.replace(/(?<=Java)Script/g, '');`,
        `'JavaScript.'.replace(/(Java)(Script)/, '$1, $1$2, and Type$2')`,
        `'JavaScript.'.replace(/Java(Script)/, 'Java$1 and Type$1')`,
        `'JavaScript.'.replace(/Java(?<script>Script)/, 'Java$<script> and Type$1')`,
        `'JavaScript.'.replace(/(JavaScript)/, '$1')`,
        `'JavaScript.'.replace(/Java(Script)/, '$1$1')`,
        `'JavaScript.'.replace(/Java(Script)/, '$1foo$1')`,
        {
            code: `
            const regex = /(Java)(Script)/g
            str.replace(regex, '$1$2');
            str2.replace(regex, '$1 and Java$2');
            str3.replace(regex, '$1 and $2');
            `,
            options: [{ strictTypes: true }],
        },
        {
            code: `
            const regex = /(Java)(Script)/g
            str.replace(regex, '$1$2');
            str2.replace(regex, '$1 and Java$2');
            str3.replace(regex, '$1 and $2');
            useUnknown(regex)
            `,
            options: [{ strictTypes: false }],
        },
        {
            code: `
            const regex = /(Java)(Script)/g
            str.replace(regex, '$1$2');
            str2.replace(regex, '$1 and Java$2');
            str3.replace(regex, '$1 and $2');
            regex.test(foo)
            `,
            options: [{ strictTypes: false }],
        },
        {
            code: `
            const regex = /(Java)(Script)/g
            str.replace(regex, '$1');
            str2.replace(regex, '$1 and Java$2');
            str3.replace(regex, '$1 and $2');
            `,
            options: [{ strictTypes: false }],
        },
        {
            code: `
            const regex = /(Java)(Script)/g
            str.replace(regex, unknown);
            str2.replace(regex, '$1 and Java$2');
            str3.replace(regex, '$1 and $2');
            `,
            options: [{ strictTypes: false }],
        },
        {
            code: `
            const regex = /(Java)(Script)/g
            str.replace(regex, 42);
            str2.replace(regex, '$1 and Java$2');
            str3.replace(regex, '$1 and $2');
            `,
            options: [{ strictTypes: false }],
        },
        `
        "aaaaaa".replace(/(a)a(a)/g, "$1b$2")
        // 'abaaba'
        "aaaaaa".replace(/(?<=a)a(?=a)/g, "b")
        // 'abbbba'
        `,
        `
        "aaaaaa".replace(/(^a+)a(a)/, "$1b$2")
        // 'aaaaba'
        "aaaaaa".replace(/(?<=^a+)a(?=a)/, "b")
        // 'abaaaa'
        `,
        `
        "aaaaaa".replace(/(a)a/g, "$1b")
        // 'ababab'
        "aaaaaa".replace(/(?<=a)a/g, "b")
        // 'abbbbb'
        `,
        `
        "aaaaaa".replace(/(a)\\w/g, "$1b")
        // 'ababab'
        "aaaaaa".replace(/(?<=a)\\w/g, "b")
        // 'abbbbb'
        `,
        `
        "aaaaaa".replace(/(\\w)a/g, "$1b")
        // 'ababab'
        "aaaaaa".replace(/(?<=\\w)a/g, "b")
        // 'abbbbb'
        `,
        `
        "aaaaaa".replace(/(aa)a/g, "$1b")
        // 'aabaab'
        "aaaaaa".replace(/(?<=aa)a/g, "b")
        // 'aabbbb'
        `,
        `
        "aaaaaa".replace(/(a)aa/g, "$1bb")
        // 'abbabb'
        "aaaaaa".replace(/(?<=a)aa/g, "bb")
        // 'abbbba'
        `,
        `
        "aaaaaa".replace(/(a)a*/g, "$1b")
        // 'ab'
        "aaaaaa".replace(/(?<=a)a*/g, "b")
        // 'abb'
        `,
        `
        "aaaaaa".replace(/(a*)a/g, "$1b")
        // 'aaaaab'
        "aaaaaa".replace(/(?<=a*)a/g, "b")
        // 'bbbbbb'
        `,
        `
        "aaaaaa".replace(/(^a+)a/, "$1b")
        // 'aaaaab'
        "aaaaaa".replace(/(?<=^a+)a/, "b")
        // 'abaaaa'
        `,
        `
        "aaaaaa".replace(/a(a+)/g, "b$1")
        // 'baaaaa'
        "aaaaaa".replace(/a(?=a+)/g, "b")
        // 'bbbbba'
        `,
        `
        "ababababa".replace(/(a)b(a)/g, "$1c$2")
        // 'acabacaba'
        "ababababa".replace(/(?<=a)b(?=a)/g, "c")
        // 'acacacaca'
        `,
        `
        "aaaaaaaaa".replace(/(a{0,3})a/g, "$1b")
        // 'aaabaaabb'
        "aaaaaaaaa".replace(/(?<=a{0,3})a/g, "b")
        // 'bbbbbbbbb'
        `,
        `
        "aaaaaaaaa".replace(/(a{0,3})aaaaa/g, "$1b")
        // 'aaaba'
        "aaaaaaaaa".replace(/(?<=a{0,3})aaaaa/g, "b")
        // 'baaaa'
        `,
    ],
    invalid: [
        {
            code: `
            const str = 'I love unicorn! I hate unicorn?'.replace(/(?<before>love )unicorn(?<after>!)/, '$<before>🦄$<after>');
            `,
            output: `
            const str = 'I love unicorn! I hate unicorn?'.replace(/(?<=love )unicorn(?=!)/, '🦄');
            `,
            errors: [
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=love )' and '(?=!)').",
                    column: 68,
                    endColumn: 84,
                },
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=love )' and '(?=!)').",
                    column: 91,
                    endColumn: 102,
                },
            ],
        },
        {
            code: `
            const str = 'I love unicorn! I hate unicorn?'.replace(/(love )unicorn(!)/, '$1🦄$2');
            `,
            output: `
            const str = 'I love unicorn! I hate unicorn?'.replace(/(?<=love )unicorn(?=!)/, '🦄');
            `,
            errors: [
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=love )' and '(?=!)').",
                    column: 68,
                    endColumn: 75,
                },
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=love )' and '(?=!)').",
                    column: 82,
                    endColumn: 85,
                },
            ],
        },
        {
            code: `
            const str = 'A JavaScript linter written in JavaScript.'.replaceAll(/Java(Script)/g, 'Type$1');
            `,
            output: `
            const str = 'A JavaScript linter written in JavaScript.'.replaceAll(/Java(?=Script)/g, 'Type');
            `,
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookahead assertion ('(?=Script)').",
                    column: 86,
                    endColumn: 94,
                },
            ],
        },
        {
            code: `
            const str = 'A JavaScript formatter written in JavaScript.'.replace(/(Java)Script/g, '$1');
            `,
            output: `
            const str = 'A JavaScript formatter written in JavaScript.'.replace(/(?<=Java)Script/g, '');
            `,
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookbehind assertion ('(?<=Java)').",
                    column: 82,
                    endColumn: 88,
                },
            ],
        },
        {
            code: `
            const str = 'JavaScript'.replace(/Java(Script)/g, '$1');
            `,
            output: `
            const str = 'JavaScript'.replace(/Java(?=Script)/g, '');
            `,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=Script)').",
            ],
        },
        {
            code: `
            const str = 'JavaScript.'.replace(/(Java)(Script)/, '$1 and Type$2');
            `,
            output: `
            const str = 'JavaScript.'.replace(/(?<=Java)(?=Script)/, ' and Type');
            `,
            errors: [
                "These capturing groups can be replaced with lookaround assertions ('(?<=Java)' and '(?=Script)').",
                "These capturing groups can be replaced with lookaround assertions ('(?<=Java)' and '(?=Script)').",
            ],
        },
        {
            code: `
            const replacement = '$<before>🦄$<after>'
            const str = 'I love unicorn! I hate unicorn?'.replace(/(?<before>love )unicorn(?<after>!)/, replacement);
            `,
            output: null,
            errors: [
                "These capturing groups can be replaced with lookaround assertions ('(?<=love )' and '(?=!)').",
                "These capturing groups can be replaced with lookaround assertions ('(?<=love )' and '(?=!)').",
            ],
        },
        {
            code: `
            const replacement = '$1🦄$2'
            const str = 'I love unicorn! I hate unicorn?'.replace(/(love )unicorn(!)/, replacement);
            `,
            output: null,
            errors: [
                "These capturing groups can be replaced with lookaround assertions ('(?<=love )' and '(?=!)').",
                "These capturing groups can be replaced with lookaround assertions ('(?<=love )' and '(?=!)').",
            ],
        },
        {
            code: `
            const str = 'JavaScript.'.replace(/(J)(ava)(Script)/, '$1Query, and Java$3');
            `,
            output: `
            const str = 'JavaScript.'.replace(/(?<=J)(ava)(?=Script)/, 'Query, and Java');
            `,
            errors: [
                "These capturing groups can be replaced with lookaround assertions ('(?<=J)' and '(?=Script)').",
                "These capturing groups can be replaced with lookaround assertions ('(?<=J)' and '(?=Script)').",
            ],
        },
        {
            code: `
            const str = 'JavaScript.'.replace(/(J)(ava)(Script)/, '$1Query, $2, and Java$3');
            `,
            output: null,
            errors: [
                "These capturing groups can be replaced with lookaround assertions ('(?<=J)' and '(?=Script)').",
                "These capturing groups can be replaced with lookaround assertions ('(?<=J)' and '(?=Script)').",
            ],
        },
        {
            code: `
            const regex = /(Java)(Script)/g
            str.replace(regex, '$1$2');
            str2.replace(regex, '$1 and Java$2');
            str3.replace(regex, '$1 and $2');
            `,
            output: `
            const regex = /(?<=Java)(?=Script)/g
            str.replace(regex, '');
            str2.replace(regex, ' and Java');
            str3.replace(regex, ' and ');
            `,
            options: [{ strictTypes: false }],
            errors: [
                "These capturing groups can be replaced with lookaround assertions ('(?<=Java)' and '(?=Script)').",
                "These capturing groups can be replaced with lookaround assertions ('(?<=Java)' and '(?=Script)').",
            ],
        },
        {
            code: `
            const regex = /(Java)(Script)/
            str.replace(regex, '$1$2');
            str2.replace(regex, '$1 and Java$2');
            str3.replace(regex, '$1 and $2');
            regex.test(str);
            `,
            output: `
            const regex = /(?<=Java)(?=Script)/
            str.replace(regex, '');
            str2.replace(regex, ' and Java');
            str3.replace(regex, ' and ');
            regex.test(str);
            `,
            options: [{ strictTypes: false }],
            errors: [
                "These capturing groups can be replaced with lookaround assertions ('(?<=Java)' and '(?=Script)').",
                "These capturing groups can be replaced with lookaround assertions ('(?<=Java)' and '(?=Script)').",
            ],
        },
        {
            code: `
            const regex = /(a)b(c)/
            "abc".replace(regex, '$1ccount');
            "abc".replace(regex, '$1$2$2ount');
            `,
            output: null,
            errors: [
                "This capturing group can be replaced with a lookbehind assertion ('(?<=a)').",
            ],
        },
        {
            code: `
            const regex = /(a)b(c)/
            "abc".replace(regex, 'dynami$2');
            "abc".replace(regex, 'dyn$1mi$2');
            `,
            output: null,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=c)').",
            ],
        },
        {
            code: `"".replace(/(a)Java/g, '$1foo')`,
            output: `"".replace(/(?<=a)Java/g, 'foo')`,
            errors: [
                "This capturing group can be replaced with a lookbehind assertion ('(?<=a)').",
            ],
        },
    ],
})
