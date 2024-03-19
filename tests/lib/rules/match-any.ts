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
        "/[\\s\\S]/",
        "/./s",
        "/./",
        "/[\\s\\d]/",
        "/\\S\\s/",
        "/[\\1-\\uFFFF]/",
        {
            code: "/[\\S\\s]/",
            options: [{ allows: ["[\\S\\s]"] }],
        },
        {
            code: "/[^]/",
            options: [{ allows: ["[^]"] }],
        },
        {
            code: "/[\\s\\S][\\S\\s][^]./s",
            options: [{ allows: ["[\\s\\S]", "[\\S\\s]", "[^]", "dotAll"] }],
        },
        "/[^\\S\\s]/",
        {
            code: "/[^\\s\\S]/",
            options: [{ allows: ["[^]"] }],
        },
        "/[^\\d\\D]/",
        "/[^\\D\\d]/",
        "/[^\\w\\W]/",
        "/[^\\W\\w]/",
        "/[^\\0-\\uFFFF]/",
        "/[^\\p{ASCII}\\P{ASCII}]/u",
        "/[^\\P{ASCII}\\p{ASCII}]/u",
        "/[^\\s\\S\\0-\\uFFFF]/",
        String.raw`/[\S\s\q{abc}]/v`,
    ],
    invalid: [
        "/[\\S\\s]/",
        String.raw`/[\S\s]/v`,
        String.raw`/[\S\s\q{a|b|c}]/v`,
        String.raw`/[[\S\s\q{abc}]--\q{abc}]/v`,
        "/[^]/",
        "/[\\d\\D]/",
        "/[\\0-\\uFFFF]/",
        "/[\\s\\S][\\S\\s][^]./s",
        {
            code: "/[\\s\\S][\\S\\s][^]./s",
            options: [{ allows: ["[^]"] }],
        },
        {
            code: "/[\\s\\S] [\\S\\s] [^] ./s",
            // Only one character class gets fixed because they all depend on the `s` flag.
            // This shared dependency causes all of their fixes to conflict, so only one fix can be applied.
            options: [{ allows: ["dotAll"] }],
        },
        {
            code: "/. [\\S\\s] [^] ./s",
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
        "/[\\p{ASCII}\\P{ASCII}]/u",
        "/[\\p{Script=Hiragana}\\P{Script=Hiragana}]/u",
        "/[\\s\\S\\0-\\uFFFF]/",
        "/[\\w\\D]/",
        "/[\\P{ASCII}\\w\\0-AZ-\\xFF]/u",
    ],
})
