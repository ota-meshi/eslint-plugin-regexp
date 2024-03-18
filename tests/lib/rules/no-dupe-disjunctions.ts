import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-dupe-disjunctions"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-dupe-disjunctions", rule as any, {
    valid: [
        String.raw`/^\s*(eslint-(?:en|dis)able)(?:\s+(\S|\S[\s\S]*\S))?\s*$/u`,
        `/a|b/`,
        `/(a|b)/`,
        `/(?:a|b)/`,
        `/(?:js|json)$/`,
        `/(?:js|json)abc/`,
        `/(?:js|json)?abc/`,
        `/<("[^"]*"|'[^']*'|[^'">])*>/g`,
        `/c+|[a-f]/`,
        `/c+|[a-f]/v`,
        String.raw`/b+(?:\w+|[+-]?\d+)/`,
        String.raw`/\d*\.\d+_|\d+\.\d*_/`,
        String.raw`/\d*\.\d+|\d+\.\d*/`,
        String.raw`/(?:\d*\.\d+|\d+\.\d*)_/`,
        {
            // reportUnreachable: 'certain'
            code: `
            const a = /a|aa/.source;
            const b = RegExp(\`\\b(\${a})\\b\`);
            `,
            options: [{ reportUnreachable: "certain" }],
        },
        {
            // reportUnreachable: 'certain' (default)
            code: `
            const a = /a|aa/.source;
            const b = RegExp(\`\\b(\${a})\\b\`);
            `,
            options: [{}],
        },
        {
            // reportUnreachable: 'certain', but report: "all"
            code: `
            const a = /a|aa/.source;
            const b = RegExp(\`\\b(\${a})\\b\`);
            `,
            options: [{ report: "all", reportUnreachable: "certain" }],
        },
    ],
    invalid: [
        `/a|a/`,
        `/(a|a)/`,
        `/(?:a|a)/`,
        `/(?=[a-c])|(?=a)/`,
        `/(?=a|a)/`,
        `/(?<=a|a)/`,
        `/(?:[ab]|[ab])/`,
        `/(?:[ab]|[ba])/`,
        String.raw`/(?:[\da-z]|[a-z\d])/`,
        `/((?:ab|ba)|(?:ab|ba))/`,
        `/((?:ab|ba)|(?:ab|ba))/v`,
        `/((?:ab|ba)|(?:ba|ab))/`,
        `/(?:(a)|(a))/`,
        `/(?:a|ab)/`,
        `/(?:.|a|b)/`,
        `/.|abc/`,
        `/a|abc/`,
        String.raw`/\w|abc|123|_|[A-Z]|\$| /`,
        String.raw`/\W|abc|123|_|[A-Z]|\$| /`,
        String.raw`/\s|abc|123|_|[A-Z]|\$| /`,
        String.raw`/\S|abc|123|_|[A-Z]|\$| /`,
        String.raw`/[^\S]|abc|123|_|[A-Z]|\$| /`,
        String.raw`/[^\r]|./`,
        String.raw`/\s|\S|./`,
        `/(?:ya?ml|yml)$/`,
        `/(?:yml|ya?ml)$/`,
        `/(?:yml|ya?ml)/`,
        {
            code: String.raw`/(?:\p{Lu}\p{L}*|[A-Z]\w*):/u`,
            options: [{ report: "all" }],
        },
        String.raw`/(?:\p{Lu}\p{L}*|[A-Z]\w*)/u`,
        {
            code: String(/b+(?:\w+|[+-]?\d+)/),
            options: [{ report: "all" }],
        },
        String(/FOO|foo(?:bar)?/i),
        String(/foo(?:bar)?|foo/),
        String(/(?=[\t ]+[\S]{1,}|[\t ]+['"][\S]|[\t ]+$|$)/),
        String(/\w+(?:\s+(?:\S+|"[^"]*"))*/),
        String(/\b(?:\d|foo|\w+)\b/),
        {
            code: String(/(?:\d|foo|\w+)a/),
            options: [{ report: "interesting" }],
        },
        String(/\d|[a-z]|_|\w/i),
        String(/((?:ab|ba)|(?:ba|ac))/),
        String(/a+|a|b|c/),
        String(/a+|(?:a|b|c)/),
        String(/a+|[abc]/),
        String(/a+|[a-c]/),
        String(/a|aa|ba/),
        String(/a|(a|b)a/),
        String(/a|(?:(a)|b)a/),
        String(/a|[ab]a/),
        `/(?:js|jso?n?)$/`,
        String.raw`/A+_|A*_/`,
        String.raw`/(?:A+|A*)_/`,
        String.raw`/[\q{a|bb}]|bb/v`,
        {
            // reportExponentialBacktracking: 'potential'
            code: String.raw`
            const partialPattern = /(?:ac?|\wb?)a/ // overlap but not exp. backtracking
            const bar = RegExp("^(?:"+partialPattern.source+")+$") // exp backtracking
            `,
            options: [{ reportExponentialBacktracking: "potential" }],
        },
        {
            // reportExponentialBacktracking: 'potential' (default)
            code: String.raw`
            const partialPattern = /(?:ac?|\wb?)a/ // overlap but not exp. backtracking
            const bar = RegExp("^(?:"+partialPattern.source+")+$") // exp backtracking
            `,
        },
        {
            // reportExponentialBacktracking: 'certain'
            code: String.raw`
            const partialPattern = /(?:ac?|\wb?)a/ // overlap but not exp. backtracking
            const bar = RegExp("^(?:"+partialPattern.source+")+$") // exp backtracking
            `,
            options: [{ reportExponentialBacktracking: "certain" }],
        },
        {
            //  reportExponentialBacktracking: "certain", but report: "all"
            code: String.raw`
            const partialPattern = /(?:ac?|\wb?)a/ // overlap but not exp. backtracking
            const bar = RegExp("^(?:"+partialPattern.source+")+$") // exp backtracking
            `,
            options: [
                { report: "all", reportExponentialBacktracking: "certain" },
            ],
        },
        {
            // reportExponentialBacktracking: 'certain'
            code: `
            const foo1 = /(?:ac?|\\wb?)a/.source;
            const bar = RegExp(\`^(?:\${foo1})+$\`);
            `,
            options: [{ reportExponentialBacktracking: "certain" }],
        },
        {
            // reportExponentialBacktracking: 'certain'
            code: `
            const foo2 = /(?:ac?|\\wb?)a/.source;
            const bar = RegExp(\`^(?:\${foo2})+$\`);
            `,
            options: [
                {
                    report: "interesting",
                    reportExponentialBacktracking: "certain",
                },
            ],
        },
        {
            // reportExponentialBacktracking: 'certain'
            code: `
            const foo3 = /(?:ac?|\\wb?)a/.source;
            const bar = RegExp(\`^(?:\${foo3})+$\`);
            `,
            options: [
                {
                    report: "interesting",
                    reportExponentialBacktracking: "potential",
                },
            ],
        },
        {
            // reportExponentialBacktracking: 'certain'
            code: String.raw`
            const partialPattern = /(?:(?:ac?|\wb?)a)+/ // overlap and backtracking.
            const bar = RegExp("^"+partialPattern.source+"$")
            `,
            options: [{ reportExponentialBacktracking: "certain" }],
        },
        {
            // reportExponentialBacktracking: 'certain'
            code: String.raw`
            const foo4 = /(?:ac?|\wb?)a/ // overlap exp.
            const bar = RegExp("^(?:(?:ac?|\\wb?)a)+$") // overlap exp backtracking
            `,
            options: [{ reportExponentialBacktracking: "certain" }],
        },
        {
            // reportUnreachable: 'potential'
            code: `
            const a = /a|aa/.source;
            const b = RegExp(\`\\b(\${a})\\b\`);
            `,
            options: [{ report: "all", reportUnreachable: "potential" }],
        },
        {
            // reportUnreachable: 'certain'
            code: `
            const a = /a|a/.source;
            const b = RegExp(\`\\b(\${a})\\b\`);
            `,
            options: [{ report: "all", reportUnreachable: "certain" }],
        },
        {
            // don't overshadow potential exponential backtracking
            code: `
            const partial = /a?|a+/.source;
            const whole = RegExp(\`^(?:\${partial})+$\`);
            `,
            options: [
                {
                    reportExponentialBacktracking: "potential",
                    reportUnreachable: "potential",
                },
            ],
        },
    ],
})
