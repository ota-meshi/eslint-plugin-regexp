import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-control-character"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-control-character", rule as any, {
    valid: [
        String.raw`/x1f/`,
        String.raw`/\\x1f/`,
        String.raw`new RegExp('x1f')`,
        String.raw`RegExp('x1f')`,
        String.raw`new RegExp('[')`,
        String.raw`RegExp('[')`,
        String.raw`new (function foo(){})('\x1f')`,
        String.raw`new RegExp('\n')`,
        String.raw`new RegExp('\\n')`,
    ],
    invalid: [
        String.raw`/\x1f/`,
        String.raw`/\\\x1f\\x1e/`,
        String.raw`/\\\x1fFOO\\x00/`,
        String.raw`/FOO\\\x1fFOO\\x1f/`,
        String.raw`new RegExp('\x1f\x1e')`,
        String.raw`new RegExp('\x1fFOO\x00')`,
        String.raw`new RegExp('FOO\x1fFOO\x1f')`,
        String.raw`RegExp('\x1f')`,
        String.raw`RegExp('\\x1f')`,
        String.raw`RegExp('\\\x1f')`,
        String.raw`RegExp('\x0a')`,
        String.raw`RegExp('\\x0a')`,
        String.raw`RegExp('\\\x0a')`,
        String.raw`/[\q{\x1f}]/v`,
    ],
})
