import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-unicode-codepoint-escapes"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-unicode-codepoint-escapes", rule as any, {
    valid: [
        `/regexp/u`,
        String.raw`/\ud83d\ude00/`,
        String.raw`/[\ud83d\ude00]/`,
        String.raw`/\u{1f600}/u`,
        String.raw`/😀/u`,
        String.raw`/\u{1f600}/v`,
        String.raw`/😀/v`,
    ],
    invalid: [
        String.raw`/\ud83d\ude00/u`,
        String.raw`/[\ud83d\ude00]/u`,
        String.raw`/\uD83D\uDE00/u`,
        String.raw`
            const s = "\\ud83d\\ude00"
            new RegExp(s, 'u')
            `,
        String.raw`
            const s = "\\ud83d"+"\\ude00"
            new RegExp(s, 'u')
            `,
        String.raw`/\ud83d\ude00/v`,
    ],
})
