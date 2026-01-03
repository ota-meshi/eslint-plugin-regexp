import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/negation.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("negation", rule as any, {
    valid: [
        String.raw`/[\d]/`,
        String.raw`/[^\d\s]/`,
        String.raw`/[^\p{ASCII}]/iu`,
        String.raw`/[^\P{Ll}]/iu`,
        String.raw`/[\p{Basic_Emoji}]/v`,
        String.raw`/[^\P{Lowercase_Letter}]/iu`,
        String.raw`/[^[^a][^b]]/v`,
    ],
    invalid: [
        String.raw`/[^\d]/`,
        String.raw`/[^\D]/`,
        String.raw`/[^\w]/`,
        String.raw`/[^\W]/`,
        String.raw`/[^\s]/`,
        String.raw`/[^\S]/`,
        String.raw`/[^\p{ASCII}]/u`,
        String.raw`/[^\P{ASCII}]/u`,
        String.raw`/[^\p{Script=Hiragana}]/u`,
        String.raw`/[^\P{Script=Hiragana}]/u`,
        String.raw`/[^\P{Ll}]/u;`,
        String.raw`/[^\P{White_Space}]/iu;`,
        String.raw`const s ="[^\\w]"
            new RegExp(s)`,
        String.raw`const s ="[^\\w]"
            new RegExp(s)
            new RegExp(s)`,
        String.raw`const s ="[^\\w]"
            new RegExp(s, "i")
            new RegExp(s)`,
        String.raw`const s ="[^\\w]"
            Number(s)
            new RegExp(s)`,
        String.raw`/[^\P{Lowercase_Letter}]/iv`,
        String.raw`/[^[^abc]]/v`,
        String.raw`/[^[^\q{a|1|A}&&\w]]/v`,
        String.raw`/[^[^a]]/iv`,
        String.raw`/[^[^\P{Lowercase_Letter}]]/iv`,
        String.raw`/[^[^[\p{Lowercase_Letter}&&[ABC]]]]/iv`,
        String.raw`/[^[^[\p{Lowercase_Letter}&&A]--B]]/iv`,
    ],
})
