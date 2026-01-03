import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-octal.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-octal", rule as any, {
    valid: [
        String.raw`/\0/`,
        String.raw`/[\7]/`,
        String.raw`/[\1-\4]/`,
        String.raw`/[\q{\0}]/v`,
    ],
    invalid: [
        String.raw`/\07/`,
        String.raw`/\077/`,
        String.raw`/[\077]/`,
        String.raw`/\0777/`,
        String.raw`/\7/`,
        String.raw`/\1\2/`,
        String.raw`/()\1\2/`,
    ],
})
