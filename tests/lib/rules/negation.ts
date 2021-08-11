import { RuleTester } from "eslint"
import rule from "../../../lib/rules/negation"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("negation", rule as any, {
    valid: [
        String.raw`/[\d]/`,
        String.raw`/[^\d\s]/`,
        String.raw`/[^\p{ASCII}]/iu`,
        String.raw`/[^\P{Ll}]/iu`,
    ],
    invalid: [
        {
            code: String.raw`/[^\d]/`,
            output: String.raw`/\D/`,
            errors: [
                {
                    message:
                        "Unexpected negated character class. Use '\\D' instead.",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 7,
                },
            ],
        },
        {
            code: String.raw`/[^\D]/`,
            output: String.raw`/\d/`,
            errors: [
                {
                    message:
                        "Unexpected negated character class. Use '\\d' instead.",
                    line: 1,
                    column: 2,
                    endLine: 1,
                    endColumn: 7,
                },
            ],
        },
        {
            code: String.raw`/[^\w]/`,
            output: String.raw`/\W/`,
            errors: ["Unexpected negated character class. Use '\\W' instead."],
        },
        {
            code: String.raw`/[^\W]/`,
            output: String.raw`/\w/`,
            errors: ["Unexpected negated character class. Use '\\w' instead."],
        },
        {
            code: String.raw`/[^\s]/`,
            output: String.raw`/\S/`,
            errors: ["Unexpected negated character class. Use '\\S' instead."],
        },
        {
            code: String.raw`/[^\S]/`,
            output: String.raw`/\s/`,
            errors: ["Unexpected negated character class. Use '\\s' instead."],
        },
        {
            code: String.raw`/[^\p{ASCII}]/u`,
            output: String.raw`/\P{ASCII}/u`,
            errors: [
                "Unexpected negated character class. Use '\\P{ASCII}' instead.",
            ],
        },
        {
            code: String.raw`/[^\P{ASCII}]/u`,
            output: String.raw`/\p{ASCII}/u`,
            errors: [
                "Unexpected negated character class. Use '\\p{ASCII}' instead.",
            ],
        },
        {
            code: String.raw`/[^\p{Script=Hiragana}]/u`,
            output: String.raw`/\P{Script=Hiragana}/u`,
            errors: [
                "Unexpected negated character class. Use '\\P{Script=Hiragana}' instead.",
            ],
        },
        {
            code: String.raw`/[^\P{Script=Hiragana}]/u`,
            output: String.raw`/\p{Script=Hiragana}/u`,
            errors: [
                "Unexpected negated character class. Use '\\p{Script=Hiragana}' instead.",
            ],
        },
        {
            code: String.raw`/[^\P{Ll}]/u;`,
            output: String.raw`/\p{Ll}/u;`,
            errors: [
                "Unexpected negated character class. Use '\\p{Ll}' instead.",
            ],
        },
        {
            code: String.raw`/[^\P{White_Space}]/iu;`,
            output: String.raw`/\p{White_Space}/iu;`,
            errors: [
                "Unexpected negated character class. Use '\\p{White_Space}' instead.",
            ],
        },
        {
            code: String.raw`const s ="[^\\w]"
            new RegExp(s)`,
            output: String.raw`const s ="\\W"
            new RegExp(s)`,
            errors: ["Unexpected negated character class. Use '\\W' instead."],
        },
        {
            code: String.raw`const s ="[^\\w]"
            new RegExp(s)
            new RegExp(s)`,
            output: null,
            errors: [
                "Unexpected negated character class. Use '\\W' instead.",
                "Unexpected negated character class. Use '\\W' instead.",
            ],
        },
        {
            code: String.raw`const s ="[^\\w]"
            new RegExp(s, "i")
            new RegExp(s)`,
            output: null,
            errors: [
                "Unexpected negated character class. Use '\\W' instead.",
                "Unexpected negated character class. Use '\\W' instead.",
            ],
        },
        {
            code: String.raw`const s ="[^\\w]"
            Number(s)
            new RegExp(s)`,
            output: null,
            errors: ["Unexpected negated character class. Use '\\W' instead."],
        },
    ],
})
