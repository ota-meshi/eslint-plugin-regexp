import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/prefer-lookaround"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
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
        "aa-a".replace(/a(\\b|$)/g, 'b$1')
        "aaa".replace(/(^)a/, '$1b')
        `,
        `
        "aaaaaa".replace(/(a)a(a)/g, "$1b$2")
        // 'abaaba'
        "aaaaaa".replace(/(?<=a)a(?=a)/g, "b")
        // 'abbbba'
        `,
        `
        "aaaaaa".replace(/(^a+)a(?=a)/, "$1b")
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
        `
        "aaaab".replace(/(a+)a+b/, "$1c")
        // 'aaac'
        "aaaab".replace(/(?<=a+)a+b/, "c")
        // 'ac'
        `,
        `
        "abaaaba".replace(/ab(a+)/g, "c$1")
        // 'caaaba'
        "abaaaba".replace(/ab(?=a+)/g, "c")
        // 'caaca'
        `,
        `
        "ababababa".replace(/(a)ba/g, "$1c")
        // 'acbacba'
        "ababababa".replace(/(?<=a)ba/g, "c")
        // 'acccc'
        `,
        `
        "aJavaJava".replace(/(a)Java/g, '$1foo')
        // 'afooJava'
        "aJavaJava".replace(/(?<=a)Java/g, 'foo')
        // 'afoofoo'
        `,
        `
        "aaaaaa".replace(/(a)a(?:)a/g, "$1bb")
        // 'abbabb'
        "aaaaaa".replace(/(?<=a)a(?:)a/g, "bb")
        // 'abbbba'
        `,
        `
        "aaaaaa".replace(/(a)aa(?:)/g, "$1bb")
        // 'abbabb'
        "aaaaaa".replace(/(?<=a)aa(?:)/g, "bb")
        // 'abbbba'
        `,
        // cannot replace assertions
        `var str = 'JavaScriptCode'.replace(/Java(Script)(?:Code)/g, 'Type$1')`,
        `var str = 'JavaScriptCode'.replace(/(?:Java)(Script)Code/g, '$1Element')`,

        // no lookbehinds
        {
            code: `
            const str = 'A JavaScript formatter written in JavaScript.'.replace(/(Java)Script/g, '$1');
            `,
            options: [{ lookbehind: false }],
        },
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
            output: `
            const regex = /(a)b(?=c)/
            "abc".replace(regex, 'dynami');
            "abc".replace(regex, 'dyn$1mi');
            `,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=c)').",
            ],
        },
        {
            code: `
            "aabcaabbcc".replace(/(a+)b+c/g, "$1_")
            // 'aa_aa_c'
            `,
            output: `
            "aabcaabbcc".replace(/(?<=a+)b+c/g, "_")
            // 'aa_aa_c'
            `,
            errors: [
                "This capturing group can be replaced with a lookbehind assertion ('(?<=a+)').",
            ],
        },
        {
            code: `"aaaaaa".replace(/(^a+)a(a)/, "$1b$2")`,
            output: `"aaaaaa".replace(/(^a+)a(?=a)/, "$1b")`,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=a)').",
            ],
        },
        {
            code: `"aaaaaa".replace(/(^a+)a((a))/, "$1b$3$2")`,
            output: null,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=(a))').",
            ],
        },
        {
            code: `var str = 'JavaScript'.replace(/Java(Script)$/g, 'Type$1')`,
            output: `var str = 'JavaScript'.replace(/Java(?=Script$)/g, 'Type')`,
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookahead assertion ('(?=Script$)').",
                    column: 37,
                    endColumn: 46,
                },
            ],
        },
        {
            code: String.raw`var str = 'JavaScript'.replace(/Java(Script)\b/g, 'Type$1')`,
            output: String.raw`var str = 'JavaScript'.replace(/Java(?=Script\b)/g, 'Type')`,
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookahead assertion ('(?=Script\\b)').",
                    column: 37,
                    endColumn: 47,
                },
            ],
        },
        {
            code: String.raw`var str = 'JavaScript'.replace(/Java(Script)(?:\b|$)/g, 'Type$1')`,
            output: String.raw`var str = 'JavaScript'.replace(/Java(?=Script(?:\b|$))/g, 'Type')`,
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookahead assertion ('(?=Script(?:\\b|$))').",
                    column: 37,
                    endColumn: 53,
                },
            ],
        },
        {
            code: `var str = 'JavaScript'.replace(/Java(Scrip)(?=t)/g, 'Type$1')`,
            output: `var str = 'JavaScript'.replace(/Java(?=Script)/g, 'Type')`,
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookahead assertion ('(?=Script)').",
                    column: 37,
                    endColumn: 49,
                },
            ],
        },
        {
            code: `var str = 'JavaScriptLinter'.replace(/Java(Script)(?=Linter|Checker)/g, 'Type$1')`,
            output: `var str = 'JavaScriptLinter'.replace(/Java(?=Script(?=Linter|Checker))/g, 'Type')`,
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookahead assertion ('(?=Script(?=Linter|Checker))').",
                    column: 43,
                    endColumn: 69,
                },
            ],
        },
        {
            code: `var str = 'Java'.replace(/^(J)ava/g, '$1Query')`,
            output: `var str = 'Java'.replace(/(?<=^J)ava/g, 'Query')`,
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookbehind assertion ('(?<=^J)').",
                    column: 27,
                    endColumn: 31,
                },
            ],
        },
        {
            code: String.raw`var str = 'Java'.replace(/\b(J)ava/g, '$1Query')`,
            output: String.raw`var str = 'Java'.replace(/(?<=\bJ)ava/g, 'Query')`,
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookbehind assertion ('(?<=\\bJ)').",
                    column: 27,
                    endColumn: 32,
                },
            ],
        },
        {
            code: String.raw`var str = 'Java'.replace(/(?:^|\b)(J)ava/g, '$1Query')`,
            output: String.raw`var str = 'Java'.replace(/(?<=(?:^|\b)J)ava/g, 'Query')`,
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookbehind assertion ('(?<=(?:^|\\b)J)').",
                    column: 27,
                    endColumn: 38,
                },
            ],
        },
        {
            code: String.raw`var str = 'Java'.replace(/(?:^|\b|[\q{}])(J)ava/gv, '$1Query')`,
            output: String.raw`var str = 'Java'.replace(/(?<=(?:^|\b|[\q{}])J)ava/gv, 'Query')`,
            errors: [
                "This capturing group can be replaced with a lookbehind assertion ('(?<=(?:^|\\b|[\\q{}])J)').",
            ],
        },
        {
            code: `var str = 'JavaScriptCode'.replace(/(?<=Java)(Script)Code/g, '$1Linter')`,
            output: `var str = 'JavaScriptCode'.replace(/(?<=JavaScript)Code/g, 'Linter')`,
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookbehind assertion ('(?<=JavaScript)').",
                    column: 37,
                    endColumn: 54,
                },
            ],
        },
        {
            code: `var str = 'JavaScriptCode'.replace(/(?<=Java|Type)(Script)Code/g, '$1Linter')`,
            output: `var str = 'JavaScriptCode'.replace(/(?<=(?<=Java|Type)Script)Code/g, 'Linter')`,
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookbehind assertion ('(?<=(?<=Java|Type)Script)').",
                    column: 37,
                    endColumn: 59,
                },
            ],
        },
        {
            code: `
            const str = 'JavaScript'.replace(/^(Java)(Script)$/, '$1 and Type$2');
            `,
            output: `
            const str = 'JavaScript'.replace(/(?<=^Java)(?=Script$)/, ' and Type');
            `,
            errors: [
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=^Java)' and '(?=Script$)').",
                    column: 47,
                    endColumn: 54,
                },
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=^Java)' and '(?=Script$)').",
                    column: 54,
                    endColumn: 63,
                },
            ],
        },
        {
            code: String.raw`
            const str = 'JavaScript'.replace(/\b(Java)(Script)\b/, '$1 and Type$2');
            `,
            output: String.raw`
            const str = 'JavaScript'.replace(/(?<=\bJava)(?=Script\b)/, ' and Type');
            `,
            errors: [
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=\\bJava)' and '(?=Script\\b)').",
                    column: 47,
                    endColumn: 55,
                },
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=\\bJava)' and '(?=Script\\b)').",
                    column: 55,
                    endColumn: 65,
                },
            ],
        },
        {
            code: String.raw`
            const str = 'JavaScript'.replace(/(?:^|\b)(Java)(Script)(?:\b|$)/, '$1 and Type$2');
            `,
            output: String.raw`
            const str = 'JavaScript'.replace(/(?<=(?:^|\b)Java)(?=Script(?:\b|$))/, ' and Type');
            `,
            errors: [
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=(?:^|\\b)Java)' and '(?=Script(?:\\b|$))').",
                    column: 47,
                    endColumn: 61,
                },
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=(?:^|\\b)Java)' and '(?=Script(?:\\b|$))').",
                    column: 61,
                    endColumn: 77,
                },
            ],
        },
        {
            code: `
            const str = 'JavaScript'.replace(/^(J)(ava)(Script)$/, '$1Query, and Java$3');
            `,
            output: `
            const str = 'JavaScript'.replace(/(?<=^J)(ava)(?=Script$)/, 'Query, and Java');
            `,
            errors: [
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=^J)' and '(?=Script$)').",
                    column: 47,
                    endColumn: 51,
                },
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=^J)' and '(?=Script$)').",
                    column: 56,
                    endColumn: 65,
                },
            ],
        },
        {
            code: String.raw`
            const str = 'JavaScript'.replace(/\b(J)(ava)(Script)\b/, '$1Query, and Java$3');
            `,
            output: String.raw`
            const str = 'JavaScript'.replace(/(?<=\bJ)(ava)(?=Script\b)/, 'Query, and Java');
            `,
            errors: [
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=\\bJ)' and '(?=Script\\b)').",
                    column: 47,
                    endColumn: 52,
                },
                {
                    message:
                        "These capturing groups can be replaced with lookaround assertions ('(?<=\\bJ)' and '(?=Script\\b)').",
                    column: 57,
                    endColumn: 67,
                },
            ],
        },
        {
            code: `var str = 'JavaScript'.replace(/Java(S)(c)(r)(i)(p)(t)/g, 'Type$1$2$3$4$5$6')`,
            output: `var str = 'JavaScript'.replace(/Java(S)(c)(r)(i)(p)(?=t)/g, 'Type$1$2$3$4$5')`,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=t)').",
            ],
        },
        {
            code: `var str = 'JavaScript'.replace(/Java(S)(c)(r)(i)(p)(?=t)/g, 'Type$1$2$3$4$5')`,
            output: `var str = 'JavaScript'.replace(/Java(S)(c)(r)(i)(?=pt)/g, 'Type$1$2$3$4')`,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=pt)').",
            ],
        },
        {
            code: `var str = 'JavaScript'.replace(/Java(S)(c)(r)(i)(?=pt)/g, 'Type$1$2$3$4')`,
            output: `var str = 'JavaScript'.replace(/Java(S)(c)(r)(?=ipt)/g, 'Type$1$2$3')`,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=ipt)').",
            ],
        },
        {
            code: `var str = 'JavaScript'.replace(/(?<=J)(a)(v)(a)Script/g, '$1$2$3Runtime')`,
            output: null,
            errors: [
                "This capturing group can be replaced with a lookbehind assertion ('(?<=Ja)').",
            ],
        },
        // Multiple alternatives
        {
            code: `
            var str1 = 'ESLint ESLint'.replace(/ES(Lint|Tree)$/g, 'TypeScriptES$1');
            var str2 = 'ESTree ESTree'.replace(/ES(Lint|Tree)$/g, 'TypeScriptES$1');
            console.log(str1, str2)
            `,
            output: `
            var str1 = 'ESLint ESLint'.replace(/ES(?=(?:Lint|Tree)$)/g, 'TypeScriptES');
            var str2 = 'ESTree ESTree'.replace(/ES(?=(?:Lint|Tree)$)/g, 'TypeScriptES');
            console.log(str1, str2)
            `,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=(?:Lint|Tree)$)').",
                "This capturing group can be replaced with a lookahead assertion ('(?=(?:Lint|Tree)$)').",
            ],
        },
        {
            code: `
            var str1 = 'ESLint ESLint'.replace(/^(E|J)S/g, '$1Script');
            var str2 = 'JSLint JSLint'.replace(/^(E|J)S/g, '$1Script');
            console.log(str1, str2)
            `,
            output: `
            var str1 = 'ESLint ESLint'.replace(/(?<=^(?:E|J))S/g, 'Script');
            var str2 = 'JSLint JSLint'.replace(/(?<=^(?:E|J))S/g, 'Script');
            console.log(str1, str2)
            `,
            errors: [
                "This capturing group can be replaced with a lookbehind assertion ('(?<=^(?:E|J))').",
                "This capturing group can be replaced with a lookbehind assertion ('(?<=^(?:E|J))').",
            ],
        },
        // Zero-length elements that are complex, or not commonly used.
        {
            code: String.raw`var str = 'foobarbaz'.replace(/foo(bar)(?:^|$|a{0}\b|(?=x)|(?<=y))/, 'test$1')`,
            output: String.raw`var str = 'foobarbaz'.replace(/foo(?=bar(?:^|$|a{0}\b|(?=x)|(?<=y)))/, 'test')`,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=bar(?:^|$|a{0}\\b|(?=x)|(?<=y)))').",
            ],
        },
        {
            code: String.raw`var str = 'foobarbaz'.replace(/foo(bar)(?<=z\w+)/, 'test$1')`,
            output: String.raw`var str = 'foobarbaz'.replace(/foo(?=bar(?<=z\w+))/, 'test')`,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=bar(?<=z\\w+))').",
            ],
        },
        {
            code: `var str = 'JavaScript'.replace(/Java(Script)^/g, 'Type$1')`,
            output: `var str = 'JavaScript'.replace(/Java(?=Script^)/g, 'Type')`,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=Script^)').",
            ],
        },
        {
            code: `var str = 'Java'.replace(/$(J)ava/g, '$1Query')`,
            output: `var str = 'Java'.replace(/(?<=$J)ava/g, 'Query')`,
            errors: [
                "This capturing group can be replaced with a lookbehind assertion ('(?<=$J)').",
            ],
        },
        {
            code: String.raw`
            const str = 'JavaScript'.replace(/^\b(J)(ava)(Script)\b$/, '$1Query, and Java$3');
            `,
            output: String.raw`
            const str = 'JavaScript'.replace(/(?<=^\bJ)(ava)(?=Script\b$)/, 'Query, and Java');
            `,
            errors: [
                "These capturing groups can be replaced with lookaround assertions ('(?<=^\\bJ)' and '(?=Script\\b$)').",
                "These capturing groups can be replaced with lookaround assertions ('(?<=^\\bJ)' and '(?=Script\\b$)').",
            ],
        },
        {
            code: String.raw`var str = 'foobar'.replace(/foo(bar)(\b|$)/, 'bar$1')`,
            output: String.raw`var str = 'foobar'.replace(/foo(?=bar(\b|$))/, 'bar')`,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=bar(\\b|$))').",
            ],
        },
        {
            code: String.raw`var str = 'foobar'.replace(/foo(bar)(\b|$)/, '$2$1')`,
            output: null,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=bar(\\b|$))').",
            ],
        },
        {
            code: `var str = 'JavaScript'.replace(/Java(Scrip)((?=t))/g, 'Type$1')`,
            output: `var str = 'JavaScript'.replace(/Java(?=Scrip((?=t)))/g, 'Type')`,
            errors: [
                "This capturing group can be replaced with a lookahead assertion ('(?=Scrip((?=t)))').",
            ],
        },
        {
            code: `var str = 'JavaScriptCode'.replace(/((?<=Java))(Script)Code/g, '$2Linter')`,
            output: `var str = 'JavaScriptCode'.replace(/(?<=((?<=Java))Script)Code/g, 'Linter')`,
            errors: [
                "This capturing group can be replaced with a lookbehind assertion ('(?<=((?<=Java))Script)').",
            ],
        },

        // no lookbehinds
        {
            code: `
            const str = 'I love unicorn! I hate unicorn?'.replace(/(?<before>love )unicorn(?<after>!)/, '$<before>🦄$<after>');
            `,
            output: `
            const str = 'I love unicorn! I hate unicorn?'.replace(/(?<before>love )unicorn(?=!)/, '$<before>🦄');
            `,
            options: [{ lookbehind: false }],
            errors: [
                {
                    message:
                        "This capturing group can be replaced with a lookahead assertion ('(?=!)').",
                    column: 91,
                    endColumn: 102,
                },
            ],
        },
    ],
})
