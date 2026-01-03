import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/strict.ts"

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
        String.raw`/\u000f/`,
        String.raw`/\x000f/`,
        String.raw`/[A--B]/v`,
    ],
    invalid: [
        // source characters
        String.raw`/]/`,
        String.raw`/{/`,
        String.raw`/}/`,

        // invalid or incomplete escape sequences
        String.raw`/\u{42}/`,
        String.raw`/\u000;/`,
        String.raw`/\x4/`,
        String.raw`/\c;/`,
        String.raw`/\p/`,
        String.raw`/\p{H}/`,
        String.raw`/\012/`,
        String.raw`/\12/`,

        // incomplete backreference
        String.raw`/\k<foo/`,
        String.raw`/\k<foo>/`,

        // useless escape
        String.raw`/\; \_ \a \- \'/`,
        String.raw`/[\; \_ \a \']/`,

        // invalid ranges
        String.raw`/[\w-a]/`,
        String.raw`/[a-\w]/`,

        // quantified assertions
        String.raw`/(?!a)+/`,
    ],
})
