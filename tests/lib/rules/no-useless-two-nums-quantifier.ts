import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-useless-two-nums-quantifier"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-two-nums-quantifier", rule as any, {
    valid: ["/a{1,2}/", "/a{1,}/", "/a{1}/", "/a?/"],
    invalid: [
        "/a{1,1}/",
        "/a{42,42}/",
        "/a{042,42}/",
        "/a{042,042}/",
        "/a{100,100}?/",
        "/a{100,100}?/v",
    ],
})
