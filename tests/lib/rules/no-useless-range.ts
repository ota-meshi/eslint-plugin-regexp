import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-useless-range"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-range", rule as any, {
    valid: [`/[a]/`, `/[ab]/`, `/[a-c]/`],
    invalid: [
        `/[a-a]/`,
        `/[a-a]/v`,
        `/[a-b]/`,
        `/[a-b]/v`,
        `/[a-a-c-c]/`,
        `/[a-abc]/`,
        `
            const s = "[a-a-c]"
            new RegExp(s)`,
        `
            const s = "[a-"+"a]"
            new RegExp(s)`,
        String.raw`
            /[,--b]/;
            /[a-a-z]/;
            /[a-a--z]/;
            /[\c-d]/;
            /[\x6-7]/;
            /[\u002-3]/;
            /[A-\u004-5]/;
            `,
        String.raw`
            /[,-\-b]/;
            /[c-d]/;
            /[x6-7]/;
            /[\x 6-7]/;
            /[u002-3]/;
            /[\u 002-3]/;
            `,
    ],
})
