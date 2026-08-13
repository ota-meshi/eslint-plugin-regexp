import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-range.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-range", rule, {
    valid: [
        `/[a]/`,
        `/[ab]/`,
        `/[abc]/`,
        `/[a-b]/`,
        `/[a-c]/`,
        `/[a-d]/`,
        `/[0-9]/`,
        `/[A-Z]/`,
        `/[a-zA-ZZ-a]/`,
        `/[ !"#$]/`,
        {
            code: `/[ !"#$]/`,
            options: [{ target: "alphanumeric" }],
        },
        {
            code: `/[ !"#$]/`,
            options: [{ target: ["alphanumeric"] }],
        },
        {
            code: `/[ !"#$]/`,
            options: [{ target: ["alphanumeric", "①-⑳"] }],
        },
        `/[ -$]/`,
        {
            code: `/[ -$]/`,
            options: [{ target: "all" }],
        },
        {
            code: `/[ -$]/`,
            options: [{ target: ["all"] }],
        },
        {
            code: `/[ -$]/`,
            settings: { regexp: { allowedCharacterRanges: "all" } },
        },
        {
            code: `/[ -$]/`,
            settings: { regexp: { allowedCharacterRanges: ["all"] } },
        },
        {
            code: `/[0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ]/`,
            options: [{ target: ["😀-😏"] }],
        },
        {
            // issue #218
            code: `/[а-яА-Я][А-Яа-я]/`,
            options: [{ target: ["alphanumeric", "а-я", "А-Я"] }],
        },

        String.raw`/[\q{a|b|c|d|e|f|abcdef}]/v`,
    ],
    invalid: [
        `/[abcd]/`,
        `/[ABCD abcd]/`,
        `/[ABCD abcd]/v`,
        `/[abc-f]/`,
        `/[a-cd-f]/`,
        `/[d-fa-c]/`,
        `/[abc_d-f]/`,
        `/[abc_d-f_h-j_k-m]/`,
        `/[a-d_d-f_h-k_j-m]/`,
        String.raw`/[0-2\d3-4]/`,
        `/[3-4560-2]/`,
        String.raw`const s = "[0-23-4\\d]"
            new RegExp(s)`,
        String.raw`const s = "[0-23" + "-4\\d]"
            new RegExp(s)`,
        {
            code: `/[ !"#$]/`,
            options: [{ target: "all" }],
        },
        {
            code: `/[abcd ①②③④⑤⑥⑦⑧⑨10⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/`,
            options: [{ target: ["alphanumeric", "①-⑳"] }],
        },
        {
            code: `/[😀😁😂😃😄 😆😇😈😉😊]/u`,
            options: [{ target: ["alphanumeric", "😀-😏"] }],
        },
        {
            code: `/[😀😁😂😃😄 😆😇😈😉😊]/u`,
            settings: {
                regexp: { allowedCharacterRanges: ["alphanumeric", "😀-😏"] },
            },
        },
    ],
})
