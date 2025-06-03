import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-quantifier"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-quantifier", rule as any, {
    valid: [
        `/regexp/`,
        `/\\d_\\d/`,
        `/Google/`,
        `/2000/`,
        `/<!--/`,
        `/\`\`\`/`,
        `/---/`,
        `/a.{1,3}?.{2,4}c/`,
        `/a.{1,3}.{2,4}?c/`,
        {
            code: `/www/`,
            options: [{ allows: ["www"] }],
        },
        {
            code: `/\\d\\d/`,
            options: [{ allows: [`\\d\\d`] }],
        },
    ],
    invalid: [
        `/\\d\\d/`,
        `/  /`,
        `/  /v`,
        String.raw`/\p{ASCII}\p{ASCII}/u`,
        String.raw`/\p{Basic_Emoji}\p{Basic_Emoji}/v`,
        `/(\\d\\d\\d*)/`,
        String.raw`/\d\d\d\d-\d\d-\d\d/`,
        String.raw`/aaa..\s\s\S\S\p{ASCII}\p{ASCII}/u`,
        `/aaaa(aaa)/u`,
        `/(b)?aaaa(b)?/u`,
        `
            const s = "\\\\d\\\\d"
            new RegExp(s)
            `,
        `
            const s = "\\\\d"+"\\\\d"
            new RegExp(s)
            `,
        {
            code: `/wwww/`,
            options: [{ allows: ["www"] }],
        },
        {
            code: String.raw`/\d\d-\d\d\d\d/`,
            options: [{ allows: [`\\d\\d`] }],
        },
    ],
})
