import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-dupe-disjunctions"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
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
        `/(?:js|jso?n?)$/`,
        `/(?:js|json)abc/`,
        `/(?:js|json)?abc/`,
        `/(?:yml|ya?ml)$/`,
        `/(?:yml|ya?ml)/`,
        `/<("[^"]*"|'[^']*'|[^'">])*>/g`,
        `/c+|[a-f]/`,
        String.raw`/b+(?:\w+|[+-]?\d+)/`,
        String.raw`/A+_|A*_/`,
        String.raw`/(?:A+|A*)_/`,
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
        {
            code: `/a|a/`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    line: 1,
                    column: 4,
                    endLine: 1,
                    endColumn: 5,
                },
            ],
        },
        {
            code: `/(a|a)/`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    line: 1,
                    column: 5,
                    endLine: 1,
                    endColumn: 6,
                },
            ],
        },
        {
            code: `/(?:a|a)/`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    line: 1,
                    column: 7,
                    endLine: 1,
                    endColumn: 8,
                },
            ],
        },
        {
            code: `/(?=[a-c])|(?=a)/`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '(?=[a-c])' and can be removed.",
                    column: 12,
                    endColumn: 17,
                },
            ],
        },
        {
            code: `/(?=a|a)/`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    line: 1,
                    column: 7,
                    endLine: 1,
                    endColumn: 8,
                },
            ],
        },
        {
            code: `/(?<=a|a)/`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    line: 1,
                    column: 8,
                    endLine: 1,
                    endColumn: 9,
                },
            ],
        },
        {
            code: `/(?:[ab]|[ab])/`,
            errors: [
                "Unexpected duplicate alternative. This alternative can be removed.",
            ],
        },
        {
            code: `/(?:[ab]|[ba])/`,
            errors: [
                "Unexpected duplicate alternative. This alternative can be removed.",
            ],
        },
        {
            code: String.raw`/(?:[\da-z]|[a-z\d])/`,
            errors: [
                "Unexpected duplicate alternative. This alternative can be removed.",
            ],
        },
        {
            code: `/((?:ab|ba)|(?:ab|ba))/`,
            errors: [
                "Unexpected duplicate alternative. This alternative can be removed.",
            ],
        },
        {
            code: `/((?:ab|ba)|(?:ba|ab))/`,
            errors: [
                "Unexpected duplicate alternative. This alternative can be removed.",
            ],
        },
        {
            code: `/(?:(a)|(a))/`,
            errors: [
                "Unexpected duplicate alternative. This alternative can be removed. Careful! This alternative contains capturing groups which might be difficult to remove.",
            ],
        },
        {
            code: `/(?:a|ab)/`,
            errors: [
                "Unexpected useless alternative. This alternative is already covered by 'a' and can be removed.",
            ],
        },
        {
            code: `/(?:.|a|b)/`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '.' and can be removed.",
                    line: 1,
                    column: 7,
                    endLine: 1,
                    endColumn: 8,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '.' and can be removed.",
                    line: 1,
                    column: 9,
                    endLine: 1,
                    endColumn: 10,
                },
            ],
        },
        {
            code: `/.|abc/`,
            errors: [
                "Unexpected useless alternative. This alternative is already covered by '.' and can be removed.",
            ],
        },
        {
            code: `/a|abc/`,
            errors: [
                "Unexpected useless alternative. This alternative is already covered by 'a' and can be removed.",
            ],
        },
        {
            code: String.raw`/\w|abc|123|_|[A-Z]|\$| /`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '\\w' and can be removed.",
                    column: 5,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '\\w' and can be removed.",
                    column: 9,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\w' and can be removed.",
                    column: 13,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\w' and can be removed.",
                    column: 15,
                },
            ],
        },
        {
            code: String.raw`/\W|abc|123|_|[A-Z]|\$| /`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\W' and can be removed.",
                    column: 21,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\W' and can be removed.",
                    column: 24,
                },
            ],
        },
        {
            code: String.raw`/\s|abc|123|_|[A-Z]|\$| /`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\s' and can be removed.",
                    column: 24,
                },
            ],
        },
        {
            code: String.raw`/\S|abc|123|_|[A-Z]|\$| /`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '\\S' and can be removed.",
                    column: 5,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '\\S' and can be removed.",
                    column: 9,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\S' and can be removed.",
                    column: 13,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\S' and can be removed.",
                    column: 15,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\S' and can be removed.",
                    column: 21,
                },
            ],
        },
        {
            code: String.raw`/[^\S]|abc|123|_|[A-Z]|\$| /`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '[^\\S]' and can be removed.",
                    column: 27,
                },
            ],
        },
        {
            code: String.raw`/[^\r]|./`,
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of '[^\\r]' and can be removed.",
            ],
        },
        {
            code: String.raw`/\s|\S|./`,
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of '\\s|\\S' and can be removed.",
            ],
        },
        {
            code: `/(?:ya?ml|yml)$/`,
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of 'ya?ml' and can be removed.",
            ],
        },
        {
            code: `/(?:ya?ml|yml)/`,
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of 'ya?ml' and can be removed.",
            ],
        },
        {
            code: String.raw`/(?:\p{Lu}\p{L}*|[A-Z]\w*):/u`,
            options: [{ report: "all" }],
            errors: [
                "Unexpected overlap. This alternative overlaps with '\\p{Lu}\\p{L}*'. The overlap is '[A-Z][A-Za-z]*'.",
            ],
        },
        {
            code: String.raw`/(?:\p{Lu}\p{L}*|[A-Z]\w*)/u`,
            errors: [
                "Unexpected useless alternative. This alternative is already covered by '\\p{Lu}\\p{L}*' and can be removed.",
            ],
        },
        {
            code: String(/b+(?:\w+|[+-]?\d+)/),
            options: [{ report: "all" }],
            errors: [
                "Unexpected overlap. This alternative overlaps with '\\w+'. The overlap is '\\d+'.",
            ],
        },
        {
            code: String(/FOO|foo(?:bar)?/i),
            errors: [
                "Unexpected useless alternative. This alternative is already covered by 'FOO' and can be removed.",
            ],
        },
        {
            code: String(/foo(?:bar)?|foo/),
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of 'foo(?:bar)?' and can be removed.",
            ],
        },
        {
            code: String(/(?=[\t ]+[\S]{1,}|[\t ]+['"][\S]|[\t ]+$|$)/),
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of '[\\t ]+[\\S]{1,}' and can be removed.",
            ],
        },
        {
            code: String(/\w+(?:\s+(?:\S+|"[^"]*"))*/),
            errors: [
                `Unexpected overlap. This alternative overlaps with '\\S+'. The overlap is '"[^\\s"]*"'. This ambiguity is likely to cause exponential backtracking.`,
            ],
        },
        {
            code: String(/\b(?:\d|foo|\w+)\b/),
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\w+' and can be removed.",
                    column: 7,
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\w+' and can be removed.",
                    column: 10,
                },
            ],
        },
        {
            code: String(/(?:\d|foo|\w+)a/),
            options: [{ report: "interesting" }],
            errors: [
                "Unexpected superset. This alternative is a superset of '\\d|foo'. It might be possible to remove the other alternative(s).",
            ],
        },
        {
            code: String(/\d|[a-z]|_|\w/i),
            errors: [
                "Unexpected useless alternative. This alternative is a strict subset of '\\d|[a-z]|_' and can be removed.",
            ],
        },
        {
            code: String(/a+|a|b|c/),
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of 'a+' and can be removed.",
                    column: 5,
                },
            ],
        },
        {
            code: String(/((?:ab|ba)|(?:ba|ac))/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '(?:ba|ac)' that go through this element are a strict subset of '(?:ab|ba)'. This element can be removed.",
                    column: 16,
                },
            ],
        },
        {
            code: String(/a+|(?:a|b|c)/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '(?:a|b|c)' that go through this element are a strict subset of 'a+'. This element can be removed.",
                    column: 8,
                },
            ],
        },
        {
            code: String(/a+|[abc]/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '[abc]' that go through this element are a strict subset of 'a+'. This element can be removed.",
                    column: 6,
                },
            ],
        },
        {
            code: String(/a+|[a-c]/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '[a-c]' that go through this element are a strict subset of 'a+'. This element can be removed.",
                    column: 6,
                },
            ],
        },
        {
            code: String(/a|aa|ba/),
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by 'a' and can be removed.",
                    column: 4,
                },
            ],
        },
        {
            code: String(/a|(a|b)a/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '(a|b)a' that go through this element are already covered by 'a'. This element can be removed. Careful! This alternative contains capturing groups which might be difficult to remove.",
                    column: 5,
                },
            ],
        },
        {
            code: String(/a|[ab]a/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '[ab]a' that go through this element are already covered by 'a'. This element can be removed.",
                    column: 5,
                },
            ],
        },
        {
            // reportExponentialBacktracking: 'potential'
            code: String.raw`
            const partialPattern = /(?:ac?|\wb?)a/ // overlap but not exp. backtracking
            const bar = RegExp("^(?:"+partialPattern.source+")+$") // exp backtracking
            `,
            options: [{ reportExponentialBacktracking: "potential" }],
            errors: [
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity might cause exponential backtracking.",
                    line: 2,
                },
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity is likely to cause exponential backtracking.",
                    line: 3,
                },
            ],
        },
        {
            // reportExponentialBacktracking: 'potential' (default)
            code: String.raw`
            const partialPattern = /(?:ac?|\wb?)a/ // overlap but not exp. backtracking
            const bar = RegExp("^(?:"+partialPattern.source+")+$") // exp backtracking
            `,
            errors: [
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity might cause exponential backtracking.",
                    line: 2,
                },
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity is likely to cause exponential backtracking.",
                    line: 3,
                },
            ],
        },
        {
            // reportExponentialBacktracking: 'certain'
            code: String.raw`
            const partialPattern = /(?:ac?|\wb?)a/ // overlap but not exp. backtracking
            const bar = RegExp("^(?:"+partialPattern.source+")+$") // exp backtracking
            `,
            options: [{ reportExponentialBacktracking: "certain" }],
            errors: [
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity is likely to cause exponential backtracking.",
                    line: 3,
                },
            ],
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
            errors: [
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity might cause exponential backtracking.",
                    line: 2,
                },
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity is likely to cause exponential backtracking.",
                    line: 3,
                },
            ],
        },
        {
            // reportExponentialBacktracking: 'certain'
            code: `
            const foo1 = /(?:ac?|\\wb?)a/.source;
            const bar = RegExp(\`^(?:\${foo1})+$\`);
            `,
            options: [{ reportExponentialBacktracking: "certain" }],
            errors: [
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity is likely to cause exponential backtracking.",
                    line: 3,
                },
            ],
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
            errors: [
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity is likely to cause exponential backtracking.",
                    line: 3,
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
            errors: [
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity might cause exponential backtracking.",
                    line: 2,
                },
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity is likely to cause exponential backtracking.",
                    line: 3,
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
            errors: [
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity is likely to cause exponential backtracking.",
                    line: 2,
                },
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity is likely to cause exponential backtracking.",
                    line: 3,
                },
            ],
        },
        {
            // reportExponentialBacktracking: 'certain'
            code: String.raw`
            const foo4 = /(?:ac?|\wb?)a/ // overlap exp.
            const bar = RegExp("^(?:(?:ac?|\\wb?)a)+$") // overlap exp backtracking
            `,
            options: [{ reportExponentialBacktracking: "certain" }],
            errors: [
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'ac?'. The overlap is 'a'. This ambiguity is likely to cause exponential backtracking.",
                    line: 3,
                },
            ],
        },
        {
            // reportUnreachable: 'potential'
            code: `
            const a = /a|aa/.source;
            const b = RegExp(\`\\b(\${a})\\b\`);
            `,
            options: [{ report: "all", reportUnreachable: "potential" }],
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by 'a' and can be removed.",
                    line: 2,
                },
            ],
        },
        {
            // reportUnreachable: 'certain'
            code: `
            const a = /a|a/.source;
            const b = RegExp(\`\\b(\${a})\\b\`);
            `,
            options: [{ report: "all", reportUnreachable: "certain" }],
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed. This ambiguity might cause exponential backtracking.",
                    line: 2,
                },
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    line: 3,
                },
            ],
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
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by 'a?' and can be removed.",
                    line: 2,
                    column: 33,
                },
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'a?'. The overlap is 'a'. This ambiguity might cause exponential backtracking.",
                    line: 2,
                    column: 33,
                },
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'a?'. The overlap is 'a'. This ambiguity is likely to cause exponential backtracking.",
                    line: 3,
                },
            ],
        },
    ],
})
