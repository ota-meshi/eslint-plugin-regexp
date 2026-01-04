import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/unicode-escape.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("unicode-escape", rule as any, {
    valid: [
        String.raw`/a \x0a \cM \0 \u{ff} \u{100} \ud83d\ude00 \u{1f600}/u`,
        {
            code: String.raw`/a \x0a \cM \0 \u{ff} \u{100} \ud83d\ude00 \u{1f600}/u`,
            options: ["unicodeCodePointEscape"],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u0100 \u00ff \ud83d\ude00 \u{1f600}/u`,
            options: ["unicodeEscape"],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u{ff} \u{100} \ud83d\ude00 \u{1f600}/v`,
            options: ["unicodeCodePointEscape"],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u0100 \u00ff \ud83d\ude00 \u{1f600}/v`,
            options: ["unicodeEscape"],
        },

        // no u flag
        {
            code: String.raw`/a \x0a \cM \0 \u0100 \u00ff \ud83d\ude00 \u{1f600}/`,
            options: ["unicodeCodePointEscape"],
        },
    ],
    invalid: [
        String.raw`/a \x0a \cM \0 \u0100 \u00ff \ud83d\ude00 \u{1f600}/u`,
        {
            code: String.raw`/a \x0a \cM \0 \u0100 \u00ff \ud83d\ude00 \u{1f600}/u`,
            options: ["unicodeCodePointEscape"],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u{ff} \u{100} \ud83d\ude00 \u{1f600}/u`,
            options: ["unicodeEscape"],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u0100 \u00ff \ud83d\ude00 \u{1f600}/v`,
            options: ["unicodeCodePointEscape"],
        },
        {
            code: String.raw`/a \x0a \cM \0 \u{ff} \u{100} \ud83d\ude00 \u{1f600}/v`,
            options: ["unicodeEscape"],
        },
    ],
})
