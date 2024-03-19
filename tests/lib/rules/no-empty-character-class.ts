import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-empty-character-class"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-empty-character-class", rule as any, {
    valid: [
        `/[a]/`,
        `/[a-z]/`,
        `/[a]?/`,
        `/[a]*/`,
        `/[[]/`,
        String.raw`/\[]/`,
        `/[^]/`,
        `/[()]/`,
        `/[ ]/`,
        String.raw`/[\s\S]/`,
        String.raw`/[\da-zA-Z_\W]/`,
        String.raw`/a[[[ab]&&b]]/v`,
        String.raw`/a[[ab]&&b]/v`,
    ],
    invalid: [
        `/[]/`,
        `/abc[]/`,
        `/([])/`,
        `new RegExp("[]");`,
        String.raw`/[^\s\S]/`,
        String.raw`/[^\da-zA-Z_\W]/`,
        String.raw`/a[[a&&b]]/v`,
        String.raw`/a[a&&b]/v`,
    ],
})
