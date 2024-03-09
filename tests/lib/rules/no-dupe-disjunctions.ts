import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-dupe-disjunctions"

const tester = new RuleTester({
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
                    suggestions: [{ messageId: "remove", output: `/a/` }],
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
                    suggestions: [{ messageId: "remove", output: `/(a)/` }],
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
                    suggestions: [{ messageId: "remove", output: `/(?:a)/` }],
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
                    suggestions: [
                        { messageId: "remove", output: `/(?=[a-c])/` },
                    ],
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
                    suggestions: [{ messageId: "remove", output: `/(?=a)/` }],
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
                    suggestions: [{ messageId: "remove", output: `/(?<=a)/` }],
                },
            ],
        },
        {
            code: `/(?:[ab]|[ab])/`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    column: 10,
                    suggestions: [
                        { messageId: "remove", output: `/(?:[ab])/` },
                    ],
                },
            ],
        },
        {
            code: `/(?:[ab]|[ba])/`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    column: 10,
                    suggestions: [
                        { messageId: "remove", output: `/(?:[ab])/` },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?:[\da-z]|[a-z\d])/`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    column: 13,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/(?:[\da-z])/`,
                        },
                    ],
                },
            ],
        },
        {
            code: `/((?:ab|ba)|(?:ab|ba))/`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    column: 13,
                    suggestions: [
                        { messageId: "remove", output: `/((?:ab|ba))/` },
                    ],
                },
            ],
        },
        {
            code: `/((?:ab|ba)|(?:ab|ba))/v`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    column: 13,
                    suggestions: [
                        { messageId: "remove", output: `/((?:ab|ba))/v` },
                    ],
                },
            ],
        },
        {
            code: `/((?:ab|ba)|(?:ba|ab))/`,
            errors: [
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    column: 13,
                    suggestions: [
                        { messageId: "remove", output: `/((?:ab|ba))/` },
                    ],
                },
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
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by 'a' and can be removed.",
                    column: 7,
                    suggestions: [{ messageId: "remove", output: `/(?:a)/` }],
                },
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
                    suggestions: [{ messageId: "remove", output: `/(?:.|b)/` }],
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '.' and can be removed.",
                    line: 1,
                    column: 9,
                    endLine: 1,
                    endColumn: 10,
                    suggestions: [{ messageId: "remove", output: `/(?:.|a)/` }],
                },
            ],
        },
        {
            code: `/.|abc/`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '.' and can be removed.",
                    column: 4,
                    suggestions: [{ messageId: "remove", output: `/./` }],
                },
            ],
        },
        {
            code: `/a|abc/`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by 'a' and can be removed.",
                    column: 4,
                    suggestions: [{ messageId: "remove", output: `/a/` }],
                },
            ],
        },
        {
            code: String.raw`/\w|abc|123|_|[A-Z]|\$| /`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '\\w' and can be removed.",
                    column: 5,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\w|123|_|[A-Z]|\$| /`,
                        },
                    ],
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '\\w' and can be removed.",
                    column: 9,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\w|abc|_|[A-Z]|\$| /`,
                        },
                    ],
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\w' and can be removed.",
                    column: 13,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\w|abc|123|[A-Z]|\$| /`,
                        },
                    ],
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\w' and can be removed.",
                    column: 15,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\w|abc|123|_|\$| /`,
                        },
                    ],
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
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\W|abc|123|_|[A-Z]| /`,
                        },
                    ],
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\W' and can be removed.",
                    column: 24,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\W|abc|123|_|[A-Z]|\$/`,
                        },
                    ],
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
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\s|abc|123|_|[A-Z]|\$/`,
                        },
                    ],
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
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\S|123|_|[A-Z]|\$| /`,
                        },
                    ],
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '\\S' and can be removed.",
                    column: 9,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\S|abc|_|[A-Z]|\$| /`,
                        },
                    ],
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\S' and can be removed.",
                    column: 13,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\S|abc|123|[A-Z]|\$| /`,
                        },
                    ],
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\S' and can be removed.",
                    column: 15,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\S|abc|123|_|\$| /`,
                        },
                    ],
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\S' and can be removed.",
                    column: 21,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\S|abc|123|_|[A-Z]| /`,
                        },
                    ],
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
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/[^\S]|abc|123|_|[A-Z]|\$/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/[^\r]|./`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '[^\\r]' and can be removed.",
                    column: 8,
                    suggestions: [
                        { messageId: "remove", output: String.raw`/[^\r]/` },
                    ],
                },
            ],
        },
        {
            code: String.raw`/\s|\S|./`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\s|\\S' and can be removed.",
                    column: 8,
                    suggestions: [
                        { messageId: "remove", output: String.raw`/\s|\S/` },
                    ],
                },
            ],
        },
        {
            code: `/(?:ya?ml|yml)$/`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of 'ya?ml' and can be removed.",
                    column: 11,
                    suggestions: [
                        { messageId: "remove", output: `/(?:ya?ml)$/` },
                    ],
                },
            ],
        },
        {
            code: `/(?:yml|ya?ml)$/`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of 'ya?ml' and can be removed.",
                    column: 5,
                    suggestions: [
                        { messageId: "remove", output: `/(?:ya?ml)$/` },
                    ],
                },
            ],
        },
        {
            code: `/(?:yml|ya?ml)/`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of 'ya?ml' and can be removed.",
                    column: 5,
                    suggestions: [
                        { messageId: "remove", output: `/(?:ya?ml)/` },
                    ],
                },
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
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by '\\p{Lu}\\p{L}*' and can be removed.",
                    column: 18,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/(?:\p{Lu}\p{L}*)/u`,
                        },
                    ],
                },
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
                {
                    message:
                        "Unexpected useless alternative. This alternative is already covered by 'FOO' and can be removed.",
                    column: 6,
                    suggestions: [{ messageId: "remove", output: `/FOO/i` }],
                },
            ],
        },
        {
            code: String(/foo(?:bar)?|foo/),
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of 'foo(?:bar)?' and can be removed.",
                    column: 14,
                    suggestions: [
                        { messageId: "remove", output: `/foo(?:bar)?/` },
                    ],
                },
            ],
        },
        {
            code: String(/(?=[\t ]+[\S]{1,}|[\t ]+['"][\S]|[\t ]+$|$)/),
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '[\\t ]+[\\S]{1,}' and can be removed.",
                    column: 20,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/(?=[\t ]+[\S]{1,}|[\t ]+$|$)/`,
                        },
                    ],
                },
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
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\b(?:foo|\w+)\b/`,
                        },
                    ],
                },
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\w+' and can be removed.",
                    column: 10,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\b(?:\d|\w+)\b/`,
                        },
                    ],
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
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '\\d|[a-z]|_' and can be removed.",
                    column: 13,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/\d|[a-z]|_/i`,
                        },
                    ],
                },
            ],
        },
        {
            code: String(/((?:ab|ba)|(?:ba|ac))/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '(?:ba|ac)' that go through 'ba' are a strict subset of '(?:ab|ba)'. This element can be removed.",
                    column: 16,
                    suggestions: [
                        { messageId: "remove", output: `/((?:ab|ba)|(?:ac))/` },
                    ],
                },
            ],
        },
        {
            code: String(/a+|a|b|c/),
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of 'a+' and can be removed.",
                    column: 5,
                    suggestions: [{ messageId: "remove", output: `/a+|b|c/` }],
                },
            ],
        },
        {
            code: String(/a+|(?:a|b|c)/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '(?:a|b|c)' that go through 'a' are a strict subset of 'a+'. This element can be removed.",
                    column: 8,
                    suggestions: [
                        { messageId: "remove", output: `/a+|(?:b|c)/` },
                    ],
                },
            ],
        },
        {
            code: String(/a+|[abc]/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '[abc]' that go through 'a' (U+0061) are a strict subset of 'a+'. This element can be removed.",
                    column: 6,
                    suggestions: [{ messageId: "remove", output: `/a+|[bc]/` }],
                },
            ],
        },
        {
            code: String(/a+|[a-c]/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '[a-c]' that go through 'a' (U+0061) are a strict subset of 'a+'. This element can be removed.",
                    column: 6,
                    suggestions: [
                        { messageId: "replaceRange", output: `/a+|[b-c]/` },
                    ],
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
                    suggestions: [{ messageId: "remove", output: `/a|ba/` }],
                },
            ],
        },
        {
            code: String(/a|(a|b)a/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '(a|b)a' that go through 'a' are already covered by 'a'. This element can be removed.",
                    column: 5,
                    suggestions: [{ messageId: "remove", output: `/a|(b)a/` }],
                },
            ],
        },
        {
            code: String(/a|(?:(a)|b)a/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '(?:(a)|b)a' that go through '(a)' are already covered by 'a'. This element can be removed. Careful! This alternative contains capturing groups which might be difficult to remove.",
                    column: 7,
                    suggestions: [],
                },
            ],
        },
        {
            code: String(/a|[ab]a/),
            errors: [
                {
                    message:
                        "Unexpected useless element. All paths of '[ab]a' that go through 'a' (U+0061) are already covered by 'a'. This element can be removed.",
                    column: 5,
                    suggestions: [{ messageId: "remove", output: `/a|[b]a/` }],
                },
            ],
        },
        {
            code: `/(?:js|jso?n?)$/`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of 'jso?n?' and can be removed.",
                    column: 5,
                    endColumn: 7,
                    suggestions: [
                        { messageId: "remove", output: `/(?:jso?n?)$/` },
                    ],
                },
            ],
        },
        {
            code: String.raw`/A+_|A*_/`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of 'A*_' and can be removed.",
                    line: 1,
                    suggestions: [{ messageId: "remove", output: `/A*_/` }],
                },
            ],
        },
        {
            code: String.raw`/(?:A+|A*)_/`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of 'A*' and can be removed.",
                    line: 1,
                    suggestions: [{ messageId: "remove", output: `/(?:A*)_/` }],
                },
            ],
        },
        {
            code: String.raw`/[\q{a|bb}]|bb/v`,
            errors: [
                {
                    message:
                        "Unexpected useless alternative. This alternative is a strict subset of '[\\q{a|bb}]' and can be removed.",
                    line: 1,
                    suggestions: [
                        {
                            messageId: "remove",
                            output: String.raw`/[\q{a|bb}]/v`,
                        },
                    ],
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
                    suggestions: [
                        {
                            messageId: "remove",
                            output: `
            const a = /a/.source;
            const b = RegExp(\`\\b(\${a})\\b\`);
            `,
                        },
                    ],
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
                    suggestions: [
                        {
                            messageId: "remove",
                            output: `
            const a = /a/.source;
            const b = RegExp(\`\\b(\${a})\\b\`);
            `,
                        },
                    ],
                },
                {
                    message:
                        "Unexpected duplicate alternative. This alternative can be removed.",
                    line: 3,
                    suggestions: [],
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
                    suggestions: [
                        {
                            messageId: "remove",
                            output: `
            const partial = /a?/.source;
            const whole = RegExp(\`^(?:\${partial})+$\`);
            `,
                        },
                    ],
                },
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'a?'. The overlap is 'a'. This ambiguity might cause exponential backtracking.",
                    line: 2,
                    suggestions: [],
                },
                {
                    message:
                        "Unexpected overlap. This alternative overlaps with 'a?'. The overlap is 'a'. This ambiguity is likely to cause exponential backtracking.",
                    line: 3,
                    suggestions: [],
                },
            ],
        },
    ],
})
