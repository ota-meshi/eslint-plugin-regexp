import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-optional-assertion"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-optional-assertion", rule as any, {
    valid: [
        String.raw`/fo(?:o\b)?/`,
        String.raw`/(?:a|(\b|-){2})?/`,
        String.raw`/(?:a|(?:\b|a)+)?/`,
        String.raw`/fo(?:o\b)/`,
        String.raw`/fo(?:o\b){1}/`,
        String.raw`/(?:(?=[\q{a}]))/v`,
    ],
    invalid: [
        {
            code: String.raw`/(?:\b|(?=a))?/`,
            errors: [
                {
                    message:
                        "This assertion effectively optional and does not change the pattern. Either remove the assertion or change the parent quantifier '?'.",
                    line: 1,
                    column: 5,
                },
                {
                    message:
                        "This assertion effectively optional and does not change the pattern. Either remove the assertion or change the parent quantifier '?'.",
                    line: 1,
                    column: 8,
                },
            ],
        },
        {
            code: String.raw`/(?:\b|a)?/`,
            errors: [
                {
                    message:
                        "This assertion effectively optional and does not change the pattern. Either remove the assertion or change the parent quantifier '?'.",
                    line: 1,
                    column: 5,
                },
            ],
        },
        {
            code: String.raw`/(?:^|a)*/`,
            errors: [
                {
                    message:
                        "This assertion effectively optional and does not change the pattern. Either remove the assertion or change the parent quantifier '*'.",
                    line: 1,
                    column: 5,
                },
            ],
        },
        {
            code: String.raw`/(?:((?:(\b|a)))|b)?/`,
            errors: [
                {
                    message:
                        "This assertion effectively optional and does not change the pattern. Either remove the assertion or change the parent quantifier '?'.",
                    line: 1,
                    column: 10,
                },
            ],
        },
        {
            code: String.raw`/(?:((?:(\b|a)))|b)*/`,
            errors: [
                {
                    message:
                        "This assertion effectively optional and does not change the pattern. Either remove the assertion or change the parent quantifier '*'.",
                    line: 1,
                    column: 10,
                },
            ],
        },
        {
            code: String.raw`/((\b)+){0,}/`,
            errors: [
                {
                    message:
                        "This assertion effectively optional and does not change the pattern. Either remove the assertion or change the parent quantifier '{0,}'.",
                    line: 1,
                    column: 4,
                },
            ],
        },
        {
            code: String.raw`/(?:(?=[\q{a}]))?/v`,
            errors: [
                {
                    message:
                        "This assertion effectively optional and does not change the pattern. Either remove the assertion or change the parent quantifier '?'.",
                    line: 1,
                    column: 5,
                },
            ],
        },
    ],
})
