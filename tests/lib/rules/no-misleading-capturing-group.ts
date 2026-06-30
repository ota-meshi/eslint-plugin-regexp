import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-misleading-capturing-group.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-misleading-capturing-group", rule as any, {
    valid: [
        "/a+a+/",
        "/(a+a+)/",
        "/(a+a+)b+/",

        "/^(a*(?!a)).+/u",
        String.raw`/(^~~?)(?!~)[\s\S]+(?=\1$)/m`,
        String.raw`/(^~~?(?!~))[\s\S]+(?=\1$)/m`,
        String.raw`/(^~(?:~|(?!~)))[\s\S]+(?=\1$)/m`,
        {
            code: "/^(a*).+/u",
            options: [{ reportBacktrackingEnds: false }],
        },
    ],
    invalid: [
        String.raw`/\d+(\d*)/`,
        String.raw`/(?:!\d+|%\w+)(\d*)/`,

        // backtracking ends
        "/^(a*).+/u",
        String.raw`/^([\t ]*).+/gmu`,
        String.raw`/('{2,5}).+?\1/`,
        String.raw`/^(---.*(?:\n|\r\n?))[\s\S]+?(?=(?:\n|\r\n?)^---$)/m`,
        String.raw`/(^~~?)[\s\S]+(?=\1$)/m`,
        String.raw`/^([a\q{abc}]*).+/v`,
    ],
})
