import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/strict"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("strict", rule as any, {
    valid: [
        `/regexp/`,
        String.raw`/\{\}\]/`,
        String.raw`/[-\w-]/`,
        String.raw`/[a-b-\w]/`,
        String.raw`/\0/`,
        String.raw`/()\1/`,
        String.raw`/(?<foo>)\k<foo>/`,
        String.raw`/\p{L}/u`,
        String.raw`/ \( \) \[ \] \{ \} \| \* \+ \? \^ \$ \\ \/ \./`,
        String.raw`/[\( \) \[ \] \{ \} \| \* \+ \? \^ \$ \\ \/ \. \-]/`,
        "/\\u000f/",
        "/\\x000f/",
        String.raw`/[A--B]/v`,
    ],
    invalid: [
        // source characters
        String.raw`/]/`,
        String.raw`/{/`,
        String.raw`/}/`,

        // invalid or incomplete escape sequences
        String.raw`/\u{42}/`,
        "/\\u000;/",
        "/\\x4/",
        "/\\c;/",
        "/\\p/",
        "/\\p{H}/",
        "/\\012/",
        "/\\12/",

        // incomplete backreference
        "/\\k<foo/",
        "/\\k<foo>/",

        // useless escape
        "/\\; \\_ \\a \\- \\'/",
        "/[\\; \\_ \\a \\']/",

        // invalid ranges
        String.raw`/[\w-a]/`,
        String.raw`/[a-\w]/`,

        // quantified assertions
        String.raw`/(?!a)+/`,
    ],
})
