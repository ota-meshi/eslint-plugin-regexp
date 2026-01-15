import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-lookaround.ts"

const tester = new SnapshotRuleTester({
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
        String.raw`
        "aa-a".replace(/a(\b|$)/g, 'b$1')
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
        String.raw`
        "aaaaaa".replace(/(a)\w/g, "$1b")
        // 'ababab'
        "aaaaaa".replace(/(?<=a)\w/g, "b")
        // 'abbbbb'
        `,
        String.raw`
        "aaaaaa".replace(/(\w)a/g, "$1b")
        // 'ababab'
        "aaaaaa".replace(/(?<=\w)a/g, "b")
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
        `
            const str = 'I love unicorn! I hate unicorn?'.replace(/(?<before>love )unicorn(?<after>!)/, '$<before>🦄$<after>');
            `,
        `
            const str = 'I love unicorn! I hate unicorn?'.replace(/(love )unicorn(!)/, '$1🦄$2');
            `,
        `
            const str = 'A JavaScript linter written in JavaScript.'.replaceAll(/Java(Script)/g, 'Type$1');
            `,
        `
            const str = 'A JavaScript formatter written in JavaScript.'.replace(/(Java)Script/g, '$1');
            `,
        `
            const str = 'JavaScript'.replace(/Java(Script)/g, '$1');
            `,
        `
            const str = 'JavaScript.'.replace(/(Java)(Script)/, '$1 and Type$2');
            `,
        `
            const replacement = '$<before>🦄$<after>'
            const str = 'I love unicorn! I hate unicorn?'.replace(/(?<before>love )unicorn(?<after>!)/, replacement);
            `,
        `
            const replacement = '$1🦄$2'
            const str = 'I love unicorn! I hate unicorn?'.replace(/(love )unicorn(!)/, replacement);
            `,
        `
            const str = 'JavaScript.'.replace(/(J)(ava)(Script)/, '$1Query, and Java$3');
            `,
        `
            const str = 'JavaScript.'.replace(/(J)(ava)(Script)/, '$1Query, $2, and Java$3');
            `,
        {
            code: `
            const regex = /(Java)(Script)/g
            str.replace(regex, '$1$2');
            str2.replace(regex, '$1 and Java$2');
            str3.replace(regex, '$1 and $2');
            `,
            options: [{ strictTypes: false }],
        },
        {
            code: `
            const regex = /(Java)(Script)/
            str.replace(regex, '$1$2');
            str2.replace(regex, '$1 and Java$2');
            str3.replace(regex, '$1 and $2');
            regex.test(str);
            `,
            options: [{ strictTypes: false }],
        },
        `
            const regex = /(a)b(c)/
            "abc".replace(regex, '$1ccount');
            "abc".replace(regex, '$1$2$2ount');
            `,
        `
            const regex = /(a)b(c)/
            "abc".replace(regex, 'dynami$2');
            "abc".replace(regex, 'dyn$1mi$2');
            `,
        `
            "aabcaabbcc".replace(/(a+)b+c/g, "$1_")
            // 'aa_aa_c'
            `,
        `"aaaaaa".replace(/(^a+)a(a)/, "$1b$2")`,
        `"aaaaaa".replace(/(^a+)a((a))/, "$1b$3$2")`,
        `var str = 'JavaScript'.replace(/Java(Script)$/g, 'Type$1')`,
        String.raw`var str = 'JavaScript'.replace(/Java(Script)\b/g, 'Type$1')`,
        String.raw`var str = 'JavaScript'.replace(/Java(Script)(?:\b|$)/g, 'Type$1')`,
        `var str = 'JavaScript'.replace(/Java(Scrip)(?=t)/g, 'Type$1')`,
        `var str = 'JavaScriptLinter'.replace(/Java(Script)(?=Linter|Checker)/g, 'Type$1')`,
        `var str = 'Java'.replace(/^(J)ava/g, '$1Query')`,
        String.raw`var str = 'Java'.replace(/\b(J)ava/g, '$1Query')`,
        String.raw`var str = 'Java'.replace(/(?:^|\b)(J)ava/g, '$1Query')`,
        String.raw`var str = 'Java'.replace(/(?:^|\b|[\q{}])(J)ava/gv, '$1Query')`,
        `var str = 'JavaScriptCode'.replace(/(?<=Java)(Script)Code/g, '$1Linter')`,
        `var str = 'JavaScriptCode'.replace(/(?<=Java|Type)(Script)Code/g, '$1Linter')`,
        `
            const str = 'JavaScript'.replace(/^(Java)(Script)$/, '$1 and Type$2');
            `,
        String.raw`
            const str = 'JavaScript'.replace(/\b(Java)(Script)\b/, '$1 and Type$2');
            `,
        String.raw`
            const str = 'JavaScript'.replace(/(?:^|\b)(Java)(Script)(?:\b|$)/, '$1 and Type$2');
            `,
        `
            const str = 'JavaScript'.replace(/^(J)(ava)(Script)$/, '$1Query, and Java$3');
            `,
        String.raw`
            const str = 'JavaScript'.replace(/\b(J)(ava)(Script)\b/, '$1Query, and Java$3');
            `,
        `var str = 'JavaScript'.replace(/Java(S)(c)(r)(i)(p)(t)/g, 'Type$1$2$3$4$5$6')`,
        `var str = 'JavaScript'.replace(/Java(S)(c)(r)(i)(p)(?=t)/g, 'Type$1$2$3$4$5')`,
        `var str = 'JavaScript'.replace(/Java(S)(c)(r)(i)(?=pt)/g, 'Type$1$2$3$4')`,
        `var str = 'JavaScript'.replace(/(?<=J)(a)(v)(a)Script/g, '$1$2$3Runtime')`,
        // Multiple alternatives
        `
            var str1 = 'ESLint ESLint'.replace(/ES(Lint|Tree)$/g, 'TypeScriptES$1');
            var str2 = 'ESTree ESTree'.replace(/ES(Lint|Tree)$/g, 'TypeScriptES$1');
            console.log(str1, str2)
            `,
        `
            var str1 = 'ESLint ESLint'.replace(/^(E|J)S/g, '$1Script');
            var str2 = 'JSLint JSLint'.replace(/^(E|J)S/g, '$1Script');
            console.log(str1, str2)
            `,
        // Zero-length elements that are complex, or not commonly used.
        String.raw`var str = 'foobarbaz'.replace(/foo(bar)(?:^|$|a{0}\b|(?=x)|(?<=y))/, 'test$1')`,
        String.raw`var str = 'foobarbaz'.replace(/foo(bar)(?<=z\w+)/, 'test$1')`,
        `var str = 'JavaScript'.replace(/Java(Script)^/g, 'Type$1')`,
        `var str = 'Java'.replace(/$(J)ava/g, '$1Query')`,
        String.raw`
            const str = 'JavaScript'.replace(/^\b(J)(ava)(Script)\b$/, '$1Query, and Java$3');
            `,
        String.raw`var str = 'foobar'.replace(/foo(bar)(\b|$)/, 'bar$1')`,
        String.raw`var str = 'foobar'.replace(/foo(bar)(\b|$)/, '$2$1')`,
        `var str = 'JavaScript'.replace(/Java(Scrip)((?=t))/g, 'Type$1')`,
        `var str = 'JavaScriptCode'.replace(/((?<=Java))(Script)Code/g, '$2Linter')`,

        // no lookbehinds
        {
            code: `
            const str = 'I love unicorn! I hate unicorn?'.replace(/(?<before>love )unicorn(?<after>!)/, '$<before>🦄$<after>');
            `,
            options: [{ lookbehind: false }],
        },
    ],
})
