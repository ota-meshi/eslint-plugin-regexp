import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/optimal-quantifier-concatenation.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("optimal-quantifier-concatenation", rule as any, {
    valid: [
        String.raw`/\w+\d{4}/`,
        String.raw`/\w+a/`,
        String.raw`/\w{3,5}\d{2,4}/`,
        String.raw`/\w{3,5}\d*/`,
        "/a+b+c+d+[abc]+/",
        String.raw`/(?:a|::)?\w+/`,
        String.raw`/\d+(?:\w+|-\d+)/`,
        "/aa?/",
        String.raw`/\w?\w/`,
        {
            code: String.raw`/(\d)\d+/`,
            options: [{ capturingGroups: "ignore" }],
        },
        String.raw`/^(?:\[\[\[?.+?\]?\]\]|<<.+?>>)$/`,
        String.raw`/a\s*?(?=\r?\n|\r)/`,
        "/(?:a|b)?c/v",
    ],
    invalid: [
        "/[a-fA-F][a-fA-F]?/",
        String.raw`/a\d*\d*a/`,
        String.raw`/\w+\d+/`,
        String.raw`/\w+\d?/`,
        String.raw`/a+\w+/`,
        String.raw`/\w+\d*/`,
        String.raw`/(\d*\w+)/`,
        "/;+.*/",
        "/a+(?:a|bb)+/",
        String.raw`/\w+(?:a|b)+/`,
        String.raw`/\d{3,5}\w*/`,

        String.raw`/\w\w*/`,
        String.raw`/\w*\w/`,
        String.raw`/\w+\w/`,
        String.raw`/\w+\w{4}/`,
        String.raw`/\w+\w{4}?/`,
        String.raw`/\w{4}\w{4}?/`,
        "/[ab]*(?:a|b)/",
        "/aa*/",
        "/a*a*/",
        "/a?a?a?/",
        "/a.{1,3}?.{2,4}?c/",
        "/a.{1,3}.{2,4}c/",
        String.raw`/\w+(?:foo|bar)?/`,
        "/[ab]*(?:a|bb)+/",
        String.raw`/(?:\d+|abc)\w+/`,
        String.raw`/(^[ \t]*)[a-z\d].+(?::{2,4}|;;)(?=\s)/im`,
        String.raw`/(^[\t ]*)#(?:const|else(?:[\t ]+if)?|end[\t ]+if|error|if).*/im`,
        String.raw`/(&(?:\r\n?|\n)\s*)!.*/`,
        String.raw`/a\s*(?=\r?\n|\r)/`,
        String.raw`/(^|[^\w.])[a-z][\w.]*(?:Error|Exception):.*(?:(?:\r\n?|\n)[ \t]*(?:at[ \t].+|\.{3}.*|Caused by:.*))+(?:(?:\r\n?|\n)[ \t]*\.\.\. .*)?/`,
        String.raw`/&key\s+\S+(?:\s+\S+)*(?:\s+&allow-other-keys)?/`,

        // multiple causes
        "/(?:xa+|y[ab]*)a*/",
        "/(?:xa+|y[ab]*)(?:a*b)?/",
        "/a+(?:a*z+[ay]*)*b/",
        "/(?:xa+|y[ab]*)(?:a*z[ac]*|xy[za]+)+b/",

        // careful with capturing groups
        String.raw`/\w+(?:(a)|b)*/`,
        String.raw`/(\d)*\w+/`,
        String.raw`/(\d)\d+/`,
        String.raw`/\d+(\d*)/`,
        String.raw`/\d+(\d*)/v`,
        String.raw`/a+[a\q{}]+/v`,
        String.raw`/[ab]*[\q{a|bb}]+/v`,
    ],
})
