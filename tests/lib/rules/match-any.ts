import { RuleTester } from "eslint"
import rule from "../../../lib/rules/match-any"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
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
    ],
    invalid: [
        {
            code: "/[\\S\\s]/",
            output: "/[\\s\\S]/",
            errors: [
                {
                    message:
                        "Unexpected using '[\\S\\s]' to match any character.",
                    column: 2,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/[^]/",
            output: "/[\\s\\S]/",
            errors: [
                {
                    message: "Unexpected using '[^]' to match any character.",
                    column: 2,
                    endColumn: 5,
                },
            ],
        },
        {
            code: "/[\\d\\D]/",
            output: "/[\\s\\S]/",
            errors: [
                {
                    message:
                        "Unexpected using '[\\d\\D]' to match any character.",
                    column: 2,
                    endColumn: 8,
                },
            ],
        },
        {
            code: "/[\\0-\\uFFFF]/",
            output: "/[\\s\\S]/",
            errors: [
                {
                    message:
                        "Unexpected using '[\\0-\\uFFFF]' to match any character.",
                    column: 2,
                    endColumn: 13,
                },
            ],
        },
        {
            code: "/[\\s\\S][\\S\\s][^]./s",
            output: "/[\\s\\S][\\s\\S][\\s\\S]./s",
            errors: [
                "Unexpected using '[\\S\\s]' to match any character.",
                "Unexpected using '[^]' to match any character.",
            ],
        },
        {
            code: "/[\\s\\S][\\S\\s][^]./s",
            output: "/[^][^][^][^]/s",
            options: [{ allows: ["[^]"] }],
            errors: [
                "Unexpected using '[\\s\\S]' to match any character.",
                "Unexpected using '[\\S\\s]' to match any character.",
                "Unexpected using '.' to match any character.",
            ],
        },
        {
            code: "/[\\s\\S] [\\S\\s] [^] ./s",
            output: "/. [\\S\\s] [^] ./s",
            options: [{ allows: ["dotAll"] }],
            errors: [
                "Unexpected using '[\\s\\S]' to match any character.",
                "Unexpected using '[\\S\\s]' to match any character.",
                "Unexpected using '[^]' to match any character.",
            ],
        },
        {
            code: "/. [\\S\\s] [^] ./s",
            output: "/. . [^] ./s",
            options: [{ allows: ["dotAll"] }],
            errors: [
                "Unexpected using '[\\S\\s]' to match any character.",
                "Unexpected using '[^]' to match any character.",
            ],
        },
        {
            code: "/. . [^] ./s",
            output: "/. . . ./s",
            options: [{ allows: ["dotAll"] }],
            errors: ["Unexpected using '[^]' to match any character."],
        },
        {
            code: "new RegExp('[^]', 's')",
            output: null,
            options: [{ allows: ["dotAll"] }],
            errors: ["Unexpected using '[^]' to match any character."],
        },
        {
            code: String.raw`
            const s = "[\\s\\S][\\S\\s][^]."
            new RegExp(s, 's')
            `,
            output: String.raw`
            const s = "[^][^][^][^]"
            new RegExp(s, 's')
            `,
            options: [{ allows: ["[^]"] }],
            errors: [
                "Unexpected using '[\\s\\S]' to match any character.",
                "Unexpected using '[\\S\\s]' to match any character.",
                "Unexpected using '.' to match any character.",
            ],
        },
        {
            code: String.raw`
            const s = "[\\s\\S]"+"[\\S\\s][^]."
            new RegExp(s, 's')
            `,
            output: null,
            options: [{ allows: ["[^]"] }],
            errors: [
                "Unexpected using '[\\s\\S]' to match any character.",
                "Unexpected using '[\\S\\s]' to match any character.",
                "Unexpected using '.' to match any character.",
            ],
        },
        {
            code: "/[\\p{ASCII}\\P{ASCII}]/u",
            output: "/[\\s\\S]/u",
            errors: [
                "Unexpected using '[\\p{ASCII}\\P{ASCII}]' to match any character.",
            ],
        },
        {
            code: "/[\\p{Script=Hiragana}\\P{Script=Hiragana}]/u",
            output: "/[\\s\\S]/u",
            errors: [
                "Unexpected using '[\\p{Script=Hiragana}\\P{Script=Hiragana}]' to match any character.",
            ],
        },
        {
            code: "/[\\s\\S\\0-\\uFFFF]/",
            output: "/[\\s\\S]/",
            errors: [
                "Unexpected using '[\\s\\S\\0-\\uFFFF]' to match any character.",
            ],
        },
        {
            code: "/[\\w\\D]/",
            output: "/[\\s\\S]/",
            errors: ["Unexpected using '[\\w\\D]' to match any character."],
        },
        {
            code: "/[\\P{ASCII}\\w\\0-AZ-\\xFF]/u",
            output: "/[\\s\\S]/u",
            errors: [
                "Unexpected using '[\\P{ASCII}\\w\\0-AZ-\\xFF]' to match any character.",
            ],
        },
    ],
})
