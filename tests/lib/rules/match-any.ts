import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/match-any"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("match-any", rule as any, {
    valid: [
        String.raw`/[\s\S]/`,
        "/./s",
        "/./",
        String.raw`/[\s\d]/`,
        String.raw`/\S\s/`,
        String.raw`/[\1-\uFFFF]/`,
        {
            code: String.raw`/[\S\s]/`,
            options: [{ allows: [String.raw`[\S\s]`] }],
        },
        {
            code: "/[^]/",
            options: [{ allows: ["[^]"] }],
        },
        {
            code: String.raw`/[\s\S][\S\s][^]./s`,
            options: [
                {
                    allows: [
                        String.raw`[\s\S]`,
                        String.raw`[\S\s]`,
                        "[^]",
                        "dotAll",
                    ],
                },
            ],
        },
        String.raw`/[^\S\s]/`,
        {
            code: String.raw`/[^\s\S]/`,
            options: [{ allows: ["[^]"] }],
        },
        String.raw`/[^\d\D]/`,
        String.raw`/[^\D\d]/`,
        String.raw`/[^\w\W]/`,
        String.raw`/[^\W\w]/`,
        String.raw`/[^\0-\uFFFF]/`,
        String.raw`/[^\p{ASCII}\P{ASCII}]/u`,
        String.raw`/[^\P{ASCII}\p{ASCII}]/u`,
        String.raw`/[^\s\S\0-\uFFFF]/`,
        String.raw`/[\S\s\q{abc}]/v`,
    ],
    invalid: [
        String.raw`/[\S\s]/`,
        String.raw`/[\S\s]/v`,
        String.raw`/[\S\s\q{a|b|c}]/v`,
        String.raw`/[[\S\s\q{abc}]--\q{abc}]/v`,
        "/[^]/",
        String.raw`/[\d\D]/`,
        String.raw`/[\0-\uFFFF]/`,
        String.raw`/[\s\S][\S\s][^]./s`,
        {
            code: String.raw`/[\s\S][\S\s][^]./s`,
            options: [{ allows: ["[^]"] }],
        },
        {
            code: String.raw`/[\s\S] [\S\s] [^] ./s`,
            // Only one character class gets fixed because they all depend on the `s` flag.
            // This shared dependency causes all of their fixes to conflict, so only one fix can be applied.
            options: [{ allows: ["dotAll"] }],
        },
        {
            code: String.raw`/. [\S\s] [^] ./s`,
            options: [{ allows: ["dotAll"] }],
        },
        {
            code: "/. . [^] ./s",
            options: [{ allows: ["dotAll"] }],
        },
        {
            code: "new RegExp('[^]', 's')",
            options: [{ allows: ["dotAll"] }],
        },
        {
            code: String.raw`
            const s = "[\\s\\S][\\S\\s][^]."
            new RegExp(s, 's')
            `,
            options: [{ allows: ["[^]"] }],
        },
        {
            code: String.raw`
            const s = "[\\s\\S]"+"[\\S\\s][^]."
            new RegExp(s, 's')
            `,
            options: [{ allows: ["[^]"] }],
        },
        String.raw`/[\p{ASCII}\P{ASCII}]/u`,
        String.raw`/[\p{Script=Hiragana}\P{Script=Hiragana}]/u`,
        String.raw`/[\s\S\0-\uFFFF]/`,
        String.raw`/[\w\D]/`,
        String.raw`/[\P{ASCII}\w\0-AZ-\xFF]/u`,
    ],
})
