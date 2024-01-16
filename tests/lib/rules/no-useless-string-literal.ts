import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-useless-string-literal"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-string-literal", rule as any, {
    valid: [String.raw`/[\q{abc}]/v`, String.raw`/[\q{ab|}]/v`],
    invalid: [
        {
            code: String.raw`/[\q{a}]/v`,
            output: String.raw`/[a]/v`,
            errors: [
                {
                    message:
                        "Unexpected string disjunction of single character.",
                    line: 1,
                    column: 6,
                },
            ],
        },
        {
            code: String.raw`/[\q{a|bc}]/v`,
            output: String.raw`/[a\q{bc}]/v`,
            errors: [
                {
                    message:
                        "Unexpected string disjunction of single character.",
                    line: 1,
                    column: 6,
                },
            ],
        },
        {
            code: String.raw`/[\q{ab|c}]/v`,
            output: String.raw`/[c\q{ab}]/v`,
            errors: [
                {
                    message:
                        "Unexpected string disjunction of single character.",
                    line: 1,
                    column: 9,
                },
            ],
        },
        {
            code: String.raw`/[\q{ab|c|de}]/v`,
            output: String.raw`/[c\q{ab|de}]/v`,
            errors: [
                {
                    message:
                        "Unexpected string disjunction of single character.",
                    line: 1,
                    column: 9,
                },
            ],
        },
        {
            code: String.raw`/[a\q{ab|\-}]/v`,
            output: String.raw`/[a\-\q{ab}]/v`,
            errors: ["Unexpected string disjunction of single character."],
        },
        {
            code: String.raw`/[\q{ab|^}]/v`,
            output: String.raw`/[\^\q{ab}]/v`,
            errors: ["Unexpected string disjunction of single character."],
        },
        {
            code: String.raw`/[\q{ab|c}&&\q{ab}]/v`,
            output: String.raw`/[[c\q{ab}]&&\q{ab}]/v`,
            errors: ["Unexpected string disjunction of single character."],
        },
        {
            code: String.raw`/[A&&\q{&}]/v`,
            output: String.raw`/[A&&\&]/v`,
            errors: ["Unexpected string disjunction of single character."],
        },
        {
            code: String.raw`/[\q{&}&&A]/v`,
            output: String.raw`/[\&&&A]/v`,
            errors: ["Unexpected string disjunction of single character."],
        },
        {
            code: String.raw`/[A&&\q{^|ab}]/v`,
            output: String.raw`/[A&&[\^\q{ab}]]/v`,
            errors: ["Unexpected string disjunction of single character."],
        },
    ],
})
