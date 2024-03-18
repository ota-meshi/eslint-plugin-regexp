import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-misleading-capturing-group"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-misleading-capturing-group", rule as any, {
    valid: [
        String.raw`/a+a+/`,
        String.raw`/(a+a+)/`,
        String.raw`/(a+a+)b+/`,

        String.raw`/^(a*(?!a)).+/u`,
        String.raw`/(^~~?)(?!~)[\s\S]+(?=\1$)/m`,
        String.raw`/(^~~?(?!~))[\s\S]+(?=\1$)/m`,
        String.raw`/(^~(?:~|(?!~)))[\s\S]+(?=\1$)/m`,
        {
            code: String.raw`/^(a*).+/u`,
            options: [{ reportBacktrackingEnds: false }],
        },
    ],
    invalid: [
        String.raw`/\d+(\d*)/`,
        String.raw`/(?:!\d+|%\w+)(\d*)/`,

        // backtracking ends
        String.raw`/^(a*).+/u`,
        String.raw`/^([\t ]*).+/gmu`,
        String.raw`/('{2,5}).+?\1/`,
        String.raw`/^(---.*(?:\n|\r\n?))[\s\S]+?(?=(?:\n|\r\n?)^---$)/m`,
        String.raw`/(^~~?)[\s\S]+(?=\1$)/m`,
        String.raw`/^([a\q{abc}]*).+/v`,
    ],
})
