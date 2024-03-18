import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-octal"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-octal", rule as any, {
    valid: ["/\\0/", "/[\\7]/", "/[\\1-\\4]/", String.raw`/[\q{\0}]/v`],
    invalid: [
        "/\\07/",
        "/\\077/",
        "/[\\077]/",
        "/\\0777/",
        "/\\7/",
        "/\\1\\2/",
        "/()\\1\\2/",
    ],
})
