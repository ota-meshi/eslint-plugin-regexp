import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-predefined-assertion"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-predefined-assertion", rule as any, {
    valid: [String.raw`/a(?=\W)/`, String.raw`/a(?=\W)/v`],
    invalid: [
        String.raw`/a(?=\w)/`,
        String.raw`/a(?!\w)/`,
        String.raw`/(?<=\w)a/`,
        String.raw`/(?<!\w)a/`,

        String.raw`/a(?=\W)./`,
        String.raw`/a(?!\W)./`,
        String.raw`/.(?<=\W)a/`,
        String.raw`/.(?<!\W)a/`,
        String.raw`/.(?<!\W)a/v`,

        String.raw`/a+(?!\w)(?:\s|bc+)+/`,

        String.raw`/(?!.)(?![^])/`,
        String.raw`/(?<!.)(?<![^])/m`,
    ],
})
