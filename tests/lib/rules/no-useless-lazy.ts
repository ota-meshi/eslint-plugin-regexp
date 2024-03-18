import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-useless-lazy"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-lazy", rule as any, {
    valid: [
        `/a*?/`,
        `/a+?/`,
        `/a{4,}?/`,
        `/a{2,4}?/`,
        `/a{2,2}/`,
        `/a{3}/`,
        `/a+?b*/`,
        `/[\\s\\S]+?bar/`,
        `/a??a?/`,
    ],
    invalid: [
        `/a{1}?/`,
        `/a{1}?/v`,
        `/a{4}?/`,
        `/a{2,2}?/`,
        String.raw`const s = "\\d{1}?"
            new RegExp(s)`,
        String.raw`const s = "\\d"+"{1}?"
            new RegExp(s)`,

        `/a+?b+/`,
        String.raw`/[\q{aa|ab}]+?b+/v`,
        `/a*?b+/`,
        `/(?:a|cd)+?(?:b+|zzz)/`,

        String.raw`/\b\w+?(?=\W)/`,
        String.raw`/\b\w+?(?!\w)/`,
        String.raw`/\b\w+?\b/`,
        String.raw`/\b\w+?$/`,
    ],
})
