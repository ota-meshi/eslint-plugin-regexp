import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-useless-assertions.ts"

const tester = new SnapshotRuleTester({
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
        String.raw`/a\bb/`,
        String.raw`/a\b[\q{foo}]/v`,
        String.raw`/,\b,/`,
        String.raw`/,\bb/`,
        String.raw`/a\b,/`,

        String.raw`/a\Bb/`,
        String.raw`/,\B,/`,
        String.raw`/,\Bb/`,
        String.raw`/a\B,/`,

        String.raw`/\w^foo/m`,
        String.raw`/\n^foo/m`,
        String.raw`/\w^foo/`,
        String.raw`/\n^foo/`,

        String.raw`/foo$\w/m`,
        String.raw`/foo$\n/m`,
        String.raw`/foo$\w/`,
        String.raw`/foo$\n/`,

        String.raw`/(?=\w)hello/`,
        String.raw`/(?=\w)\d/`,
        String.raw`/(?=\w)\w/`,
        String.raw`/(?=\w)(?:a+|b*c?|\d)d/`,
        String.raw`/(?!\w)hello/`,
        String.raw`/(?!\w)\d/`,
        String.raw`/(?!\w)\w/`,
        String.raw`/(?!\w)(?:a+|b*c?|\d)d/`,

        String.raw`/(?=\w),/`,
        String.raw`/(?=a)(,|b|c|(da)+)a/`,
        String.raw`/(?!\w),/`,
        String.raw`/(?!a)(,|b|c|(da)+)a/`,

        String.raw`/(\d)(?=\w)\1/`,
        String.raw`/(\d)(?!\w)\1/`,

        String.raw`/[a-z_]\w*\b(?=\s*;)/`,
        String.raw`/[a-z_]\w*(?!\\)(?=\s*;)/`,
        String.raw`/[a-z_]\w*(?!\\)\b(?=\s*;)/`,
        String.raw`/[a-z_]\w*\b(?!\\)(?=\s*;)/`,
        String.raw`/(?=a|$)b/u`,

        String.raw`/^^a$$/`,
        String.raw`/^^a$$/m`,
        String.raw`/\b^a\b$/u`,
        String.raw`/^\ba$\b/`,
        String.raw`/\b\ba\b\b/u`,
        String.raw`/Java(?=Script)$/`,
        String.raw`/Java$(?=Script)/`,
        String.raw`/a$(?!.)/s`,
        String.raw`/a(?!.)$/s`,

        String.raw`/^(\b|\B-[a-z]{1,10}-)((?:repeating-)?(?:linear|radial)-gradient)/`,

        String.raw`/(?!$)$/`,
        String.raw`/(?=a|$)a/`,
        String.raw`/(?=(?=[a-f])(?=a|A)[\w%])a/`,
        String.raw`/(?=(?=[a-f])(?=[aA])\w(?<=[aA])(?<=[a-f]))a/`,

        String.raw`/foo(?:\.(?!$)|$)$/`,
        String.raw`/(?=a)+a/`,
        String.raw`/(?!a)*a/`,
        String.raw`/a(\B)b/`,
        String.raw`/a(\b)b/`,
        String.raw`/foo|b(?:a(?:\br)|oo)|baz/`,
    ],
})
