import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/require-unicode-sets-regexp"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("require-unicode-sets-regexp", rule as any, {
    valid: [`/a/v`],
    invalid: [
        `/a/`,
        `/a/u`,
        String.raw`/[\p{ASCII}]/iu`,
        `/[[]/u`,
        String.raw`/[^\P{Lowercase_Letter}]/giu`,
        String.raw`/[^\P{ASCII}]/iu`,
        String.raw`/[\P{ASCII}]/iu`,
        ...[
            "&&",
            "!!",
            "##",
            "$$",
            "%%",
            "**",
            "++",
            ",,",
            "..",
            "::",
            ";;",
            "<<",
            "==",
            ">>",
            "??",
            "@@",
            "^^",
            "``",
            "~~",
        ].map((punctuator) => ({
            code: String.raw`/[a${punctuator}b]/u`,
        })),
        String.raw`/[+--b]/u`,
    ],
})
