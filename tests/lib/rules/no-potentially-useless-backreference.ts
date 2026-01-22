import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-potentially-useless-backreference.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-potentially-useless-backreference", rule as any, {
    valid: [
        String.raw`/()\1/`,
        String.raw`/(a*)(?:a|\1)/`,
        String.raw`/(a)+\1/`,
        String.raw`/(?=(a))\1/`,
        String.raw`/([\q{a}])\1/v`,

        // done by regexp/no-useless-backreference
        String.raw`/(a+)b|\1/`,
    ],
    invalid: [
        String.raw`
            var foo = /(a+)b\1/;

            var foo = /(a)?b\1/;
            var foo = /((a)|c)+b\2/;`,
        String.raw`/(a)?\1/`,
        String.raw`/(a)*\1/`,
        String.raw`/(?:(a)|b)\1/`,
        String.raw`/(?:(a)|b)+\1/`,
        String.raw`/(?:([\q{a}])|b)\1/v`,
    ],
})
