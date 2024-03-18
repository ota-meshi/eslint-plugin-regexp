import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-empty-lookarounds-assertion"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-empty-lookarounds-assertion", rule as any, {
    valid: [
        "/x(?=y)/",
        "/x(?!y)/",
        "/(?<=y)x/",
        "/(?<!y)x/",
        "/(^)x/",
        "/x($)/",
        "/(?=(?=.).*)/",
        "/(?=$|a)/",
        "/(?=\\ba*\\b)/",
        '/b?r(#*)"(?:[^"]|"(?!\\1))*"\\1/',
        String.raw`/x(?=[\q{a}])/v`,
    ],
    invalid: [
        "/x(?=)/",
        "/x(?!)/",
        "/(?<=)x/",
        "/(?<!)x/",
        "/x(?=|)/",
        "/x(?!|)/",
        "/(?<=|)x/",
        "/(?<!|)x/",

        "/x(?=y|)/",
        "/x(?!y|)/",
        "/(?<=y|)x/",
        "/(?<!y|)x/",

        "/(?=a*)/",
        "/(?=a|b*)/",
        String.raw`/x(?=[\q{}])/v`,
    ],
})
