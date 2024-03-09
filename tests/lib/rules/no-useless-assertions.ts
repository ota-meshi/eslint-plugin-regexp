import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-useless-assertions"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-assertions", rule as any, {
    valid: [
        String.raw`/\b(?:aaa|\w|\d)\b/`,
        String.raw`/\b(?:,|:)\b/`,
        String.raw`/\b.\b/`,
        String.raw`/\B(?:aaa|\w|\d)\B/`,
        String.raw`/\B(?:,|:)\B/`,
        String.raw`/\B.\B/`,

        String.raw`/^foo$/`,
        String.raw`/\s^foo$\s/m`,
        String.raw`/.\s*^foo$\s*./m`,

        String.raw`/\w+(?=\s*;)/`,
        String.raw`/\w+(?=a)/`,
        String.raw`/\w+(?!a)/`,
        String.raw`/(?<=;\s*)\w+/`,
        String.raw`/(?<=a)\w+/`,
        String.raw`/(?<!a)\w+/`,

        String.raw`/(?=\w)\d?/`,
        String.raw`/(?!\d)\w+/`,
        String.raw`/(?=\d)\w+/`,
        String.raw`/(?=hello)\w+/`,

        String.raw`/(?=\w)[\d:]/`,
        String.raw`/(?!\w)[\d:]/`,

        String.raw`/(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/`,
        String.raw`/(\w)(?=\1)\w+/`,

        // this case is interesting because it has follow a path that goes back into the loop
        String.raw`/(?:-|\w(?!b))*a/`,
        String.raw`/(?:-|\w(?!b))+a/`,
        String.raw`/(?:-|\w(?!b)){2}a/`,
        // this case is interesting because there are technically exponentially many paths it has to follow. Because the
        // `\b` is in a `()+` (`(\b)+` == `\b(\b)*`), we don't know wether the \b is the first element or wether it's
        // part of the star. This means that we have to try out both paths, one where we assume that it's the first
        // element and one where we assume that it isn't. This gives us 2 options to try. This number grows
        // exponentially for nested loops. In this case, the 48 nested loops necessitate 2.8e14 starting positions.
        // There needs to be some optimization to work around this problem.
        String.raw`/((((((((((((((((((((((((((((((((((((((((((((((((\b)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+)+/`,

        // https://github.com/ota-meshi/eslint-plugin-regexp/issues/258
        String.raw`
        const orig = /^https?:\/\//i;
        const clone = new RegExp(orig);
        `,
    ],
    invalid: [
        {
            code: String.raw`/a\bb/`,
            errors: [
                {
                    message:
                        "'\\b' will always reject because it is preceded by a word character and followed by a word character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/a\b[\q{foo}]/v`,
            errors: [
                {
                    message:
                        "'\\b' will always reject because it is preceded by a word character and followed by a word character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/v`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/,\b,/`,
            errors: [
                {
                    message:
                        "'\\b' will always reject because it is preceded by a non-word character and followed by a non-word character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/,\bb/`,
            errors: [
                {
                    message:
                        "'\\b' will always accept because it is preceded by a non-word character and followed by a word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/,b/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/a\b,/`,
            errors: [
                {
                    message:
                        "'\\b' will always accept because it is preceded by a word character and followed by a non-word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/a,/`,
                        },
                    ],
                },
            ],
        },

        {
            code: String.raw`/a\Bb/`,
            errors: [
                {
                    message:
                        "'\\B' will always accept because it is preceded by a word character and followed by a word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/ab/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/,\B,/`,
            errors: [
                {
                    message:
                        "'\\B' will always accept because it is preceded by a non-word character and followed by a non-word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/,,/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/,\Bb/`,
            errors: [
                {
                    message:
                        "'\\B' will always reject because it is preceded by a non-word character and followed by a word character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/a\B,/`,
            errors: [
                {
                    message:
                        "'\\B' will always reject because it is preceded by a word character and followed by a non-word character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },

        {
            code: String.raw`/\w^foo/m`,
            errors: [
                {
                    message:
                        "'^' will always reject because it is preceded by a non-line-terminator character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/m`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/\n^foo/m`,
            errors: [
                {
                    message:
                        "'^' will always accept because it is preceded by a line-terminator character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/\nfoo/m`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/\w^foo/`,
            errors: [
                {
                    message:
                        "'^' will always reject because it is preceded by a character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/\n^foo/`,
            errors: [
                {
                    message:
                        "'^' will always reject because it is preceded by a character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },

        {
            code: String.raw`/foo$\w/m`,
            errors: [
                {
                    message:
                        "'$' will always reject because it is followed by a non-line-terminator character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/m`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/foo$\n/m`,
            errors: [
                {
                    message:
                        "'$' will always accept because it is followed by a line-terminator character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/foo\n/m`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/foo$\w/`,
            errors: [
                {
                    message:
                        "'$' will always reject because it is followed by a character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/foo$\n/`,
            errors: [
                {
                    message:
                        "'$' will always reject because it is followed by a character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },

        {
            code: String.raw`/(?=\w)hello/`,
            errors: [
                {
                    message: "The lookahead '(?=\\w)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/hello/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?=\w)\d/`,
            errors: [
                {
                    message: "The lookahead '(?=\\w)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/\d/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?=\w)\w/`,
            errors: [
                {
                    message: "The lookahead '(?=\\w)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/\w/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?=\w)(?:a+|b*c?|\d)d/`,
            errors: [
                {
                    message: "The lookahead '(?=\\w)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/(?:a+|b*c?|\d)d/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?!\w)hello/`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!\\w)' will always reject.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?!\w)\d/`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!\\w)' will always reject.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?!\w)\w/`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!\\w)' will always reject.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?!\w)(?:a+|b*c?|\d)d/`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!\\w)' will always reject.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },

        {
            code: String.raw`/(?=\w),/`,
            errors: [
                {
                    message: "The lookahead '(?=\\w)' will always reject.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?=a)(,|b|c|(da)+)a/`,
            errors: [
                {
                    message: "The lookahead '(?=a)' will always reject.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?!\w),/`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!\\w)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/,/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?!a)(,|b|c|(da)+)a/`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!a)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/(,|b|c|(da)+)a/`,
                        },
                    ],
                },
            ],
        },

        {
            code: String.raw`/(\d)(?=\w)\1/`,
            errors: [
                {
                    message: "The lookahead '(?=\\w)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/(\d)\1/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(\d)(?!\w)\1/`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!\\w)' will always reject.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },

        {
            code: String.raw`/[a-z_]\w*\b(?=\s*;)/`,
            errors: [
                {
                    message:
                        "'\\b' will always accept because it is preceded by a word character and followed by a non-word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/[a-z_]\w*(?=\s*;)/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/[a-z_]\w*(?!\\)(?=\s*;)/`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!\\\\)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/[a-z_]\w*(?=\s*;)/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/[a-z_]\w*(?!\\)\b(?=\s*;)/`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!\\\\)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/[a-z_]\w*\b(?=\s*;)/`,
                        },
                    ],
                },
                {
                    message:
                        "'\\b' will always accept because it is preceded by a word character and followed by a non-word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/[a-z_]\w*(?!\\)(?=\s*;)/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/[a-z_]\w*\b(?!\\)(?=\s*;)/`,
            errors: [
                {
                    message:
                        "'\\b' will always accept because it is preceded by a word character and followed by a non-word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/[a-z_]\w*(?!\\)(?=\s*;)/`,
                        },
                    ],
                },
                {
                    message:
                        "The negative lookahead '(?!\\\\)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/[a-z_]\w*\b(?=\s*;)/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?=a|$)b/u`,
            errors: [
                {
                    message: "The lookahead '(?=a|$)' will always reject.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/u`,
                        },
                    ],
                },
            ],
        },

        {
            code: String.raw`/^^a$$/`,
            errors: [
                {
                    message:
                        "'^' will always accept because it is never preceded by a character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/^a$$/`,
                        },
                    ],
                },
                {
                    message:
                        "'$' will always accept because it is never followed by a character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/^^a$/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/^^a$$/m`,
            errors: [
                {
                    message:
                        "'^' will always accept because it is preceded by a line-terminator character or the start of the input string.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/^a$$/m`,
                        },
                    ],
                },
                {
                    message:
                        "'$' will always accept because it is followed by a line-terminator character or the end of the input string.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/^^a$/m`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/\b^a\b$/u`,
            errors: [
                {
                    message:
                        "'\\b' will always accept because it is preceded by a non-word character and followed by a word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/^a\b$/u`,
                        },
                    ],
                },
                {
                    message:
                        "'\\b' will always accept because it is preceded by a word character and followed by a non-word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/\b^a$/u`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/^\ba$\b/`,
            errors: [
                {
                    message:
                        "'\\b' will always accept because it is preceded by a non-word character and followed by a word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/^a$\b/`,
                        },
                    ],
                },
                {
                    message:
                        "'\\b' will always accept because it is preceded by a word character and followed by a non-word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/^\ba$/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/\b\ba\b\b/u`,
            errors: [
                {
                    message:
                        "'\\b' will always accept because it is preceded by a non-word character and followed by a word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/\ba\b\b/u`,
                        },
                    ],
                },
                {
                    message:
                        "'\\b' will always accept because it is preceded by a word character and followed by a non-word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/\b\ba\b/u`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/Java(?=Script)$/`,
            errors: [
                {
                    message: "The lookahead '(?=Script)' will always reject.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/Java$(?=Script)/`,
            errors: [
                {
                    message:
                        "'$' will always reject because it is followed by a character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/a$(?!.)/s`,
            errors: [
                {
                    message:
                        "'$' will always accept because it is never followed by a character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/a(?!.)/s`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/a(?!.)$/s`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!.)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/a$/s`,
                        },
                    ],
                },
            ],
        },

        {
            code: String.raw`/^(\b|\B-[a-z]{1,10}-)((?:repeating-)?(?:linear|radial)-gradient)/`,
            errors: [
                {
                    message:
                        "'\\b' will always accept because it is preceded by a non-word character and followed by a word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/^(|\B-[a-z]{1,10}-)((?:repeating-)?(?:linear|radial)-gradient)/`,
                        },
                    ],
                },
                {
                    message:
                        "'\\B' will always accept because it is preceded by a non-word character and followed by a non-word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/^(\b|-[a-z]{1,10}-)((?:repeating-)?(?:linear|radial)-gradient)/`,
                        },
                    ],
                },
            ],
        },

        {
            code: String.raw`/(?!$)$/`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!$)' will always reject.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/[]/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?=a|$)a/`,
            errors: [
                {
                    message: "The lookahead '(?=a|$)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/a/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?=(?=[a-f])(?=a|A)[\w%])a/`,
            errors: [
                {
                    message:
                        "The lookahead '(?=(?=[a-f])(?=a|A)[\\w%])' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/a/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?=(?=[a-f])(?=[aA])\w(?<=[aA])(?<=[a-f]))a/`,
            errors: [
                {
                    message:
                        "The lookahead '(?=(?=[a-f])(?=[aA])\\w(?<=[aA])(?<=[a-f]))' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/a/`,
                        },
                    ],
                },
            ],
        },

        {
            code: String.raw`/foo(?:\.(?!$)|$)$/`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!$)' will always reject.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/foo(?:$)$/`,
                        },
                    ],
                },
                {
                    message:
                        "'$' will always accept because it is never followed by a character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/foo(?:\.(?!$)|)$/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?=a)+a/`,
            errors: [
                {
                    message: "The lookahead '(?=a)' will always accept.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/a/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?!a)*a/`,
            errors: [
                {
                    message:
                        "The negative lookahead '(?!a)' will always reject.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/a/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/a(\B)b/`,
            errors: [
                {
                    message:
                        "'\\B' will always accept because it is preceded by a word character and followed by a word character.",
                    suggestions: [
                        {
                            messageId: "acceptSuggestion",
                            output: String.raw`/a()b/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/a(\b)b/`,
            errors: [
                {
                    message:
                        "'\\b' will always reject because it is preceded by a word character and followed by a word character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/a([])b/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/foo|b(?:a(?:\br)|oo)|baz/`,
            errors: [
                {
                    message:
                        "'\\b' will always reject because it is preceded by a word character and followed by a word character.",
                    suggestions: [
                        {
                            messageId: "rejectSuggestion",
                            output: String.raw`/foo|b(?:oo)|baz/`,
                        },
                    ],
                },
            ],
        },
    ],
})
