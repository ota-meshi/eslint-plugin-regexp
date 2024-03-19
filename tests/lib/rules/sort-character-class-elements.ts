import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/sort-character-class-elements"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("sort-character-class-elements", rule as any, {
    valid: [
        `/[abcd]/`,
        String.raw`/[aa]/u`,
        String.raw`/[\d\d]/u`,
        String.raw`/[\s\S]/u`,
        String.raw`/[\S\s]/u`,
        String.raw`/[\d\D]/u`,
        String.raw`/[\D\d]/u`,
        String.raw`/[\w\W]/u`,
        String.raw`/[\W\w]/u`,
        String.raw`/[\p{Script=Hiragana}\p{Script=Hiragana}]/u`,
        String.raw`/[\p{Script=Hiragana}\P{Script=Hiragana}]/u`,
        String.raw`/[\P{Script=Hiragana}\p{Script=Hiragana}]/u`,
        String.raw`/[\w\p{ASCII}]/u`,
        {
            code: String.raw`/[\w\p{ASCII}]/u`,
            options: [{ order: [] }],
        },
        String.raw`/[\p{ASCII}\p{Script=Hiragana}]/u`,
        String.raw`/[\w\d]/u`,
        {
            code: String.raw`/[\w\d]/u`,
            options: [{ order: [] }],
        },
        String.raw`/[\p{ASCII}a]/u`,
        {
            code: String.raw`/[\p{ASCII}a]/u`,
            options: [{ order: [] }],
        },
        String.raw`/[a\q{a}[a][a--b]]/v`,
        String.raw`/[\q{a}\q{b}\q{c}]/v`,
        String.raw`/[\q{aa}\q{ab}\q{ac}]/v`,
    ],
    invalid: [
        `/[acdb]/`,
        `/[b-da]/`,
        {
            code: `/[b-da]/`,
            options: [{ order: [] }],
        },
        `/[da-c]/`,
        {
            code: `/[da-c]/`,
            options: [{ order: [] }],
        },
        String.raw`/[abcd\d]/`,
        String.raw`/[\s\d\w]/`,
        {
            code: String.raw`/[\s\d\w]/`,
            options: [{ order: [] }],
        },
        String.raw`/[\p{ASCII}\w]/u`,
        {
            code: String.raw`/[\p{ASCII}\w]/u`,
            options: [{ order: [] }],
        },
        String.raw`/[\p{Script=Hiragana}\p{ASCII}]/u`,
        String.raw`/[\p{Script=Hiragana}\p{Script=Han}]/u`,
        {
            code: String.raw`/[\d\w]/u`,
            options: [{ order: [] }],
        },
        String.raw`/[\da-b-]/u`,
        String.raw`/[a-b-]/u`,
        String.raw`/[-$a]/u`,
        String.raw`/[-_\s]+/gu`,
        String.raw`/[-_-]/u`,
        {
            code: String.raw`const s = "[\\d\\w]"
            new RegExp(s, 'u')`,
            options: [{ order: [] }],
        },
        String.raw`
            const jsxWhitespaceChars = " \n\r\t";
            const matchJsxWhitespaceRegex = new RegExp("([" + jsxWhitespaceChars + "]+)");
            `,
        String.raw`/[[a--b][a]\q{a}a]/v`,
        String.raw`/[\q{a}[a--b][a]a]/v`,
        String.raw`/[[b--c][a]]/v`,
        {
            code: String.raw`/[[a]\q{a}]/v; /[\q{a}a]/v; /[[b-c]\q{a}]/v; /[[b-c][a]]/v;`,
            options: [{ order: [] }],
        },
        String.raw`/[\q{c}\q{b}\q{a}]/v`,
        String.raw`/[\q{b}\q{c}\q{a}]/v`,
        String.raw`/[\q{ac}\q{ab}\q{aa}]/v`,
        String.raw`/[\q{ab}\q{ac}\q{aa}]/v`,
    ],
})
