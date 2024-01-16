import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/prefer-named-replacement"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-named-replacement", rule as any, {
    valid: [
        `"str".replace(/regexp/, "foo")`,
        `"str".replace(/a(b)c/, "_$1_")`,
        `"str".replaceAll(/a(b)c/, "_$1_")`,
        `"str".replace(/a(?<foo>b)c/, "_$<foo>_")`,
        `"str".replaceAll(/a(?<foo>b)c/, "_$<foo>_")`,
        `"str".replace(/a(?<foo>b)c/, "_$0_")`,
        `"str".replace(/(a)(?<foo>b)c/, "_$1_")`,
        `"str".replace(/a(b)c/, "_$2_")`,
        `unknown.replace(/a(?<foo>b)c/, "_$1_")`,
        `unknown.replaceAll(/a(?<foo>b)c/, "_$1_")`,
    ],
    invalid: [
        {
            code: `"str".replace(/a(?<foo>b)c/, "_$1_")`,
            output: `"str".replace(/a(?<foo>b)c/, "_$<foo>_")`,
            errors: [
                {
                    message:
                        "Unexpected indexed reference in replacement string.",
                    line: 1,
                    column: 32,
                },
            ],
        },
        {
            code: `"str".replace(/a(?<foo>b)c/v, "_$1_")`,
            output: `"str".replace(/a(?<foo>b)c/v, "_$<foo>_")`,
            errors: ["Unexpected indexed reference in replacement string."],
        },
        {
            code: `"str".replaceAll(/a(?<foo>b)c/, "_$1_")`,
            output: `"str".replaceAll(/a(?<foo>b)c/, "_$<foo>_")`,
            errors: [
                {
                    message:
                        "Unexpected indexed reference in replacement string.",
                    line: 1,
                    column: 35,
                },
            ],
        },
        {
            code: `"str".replace(/(a)(?<foo>b)c/, "_$1$2_")`,
            output: `"str".replace(/(a)(?<foo>b)c/, "_$1$<foo>_")`,
            errors: [
                {
                    message:
                        "Unexpected indexed reference in replacement string.",
                    line: 1,
                    column: 36,
                },
            ],
        },
        {
            code: `unknown.replace(/a(?<foo>b)c/, "_$1_")`,
            output: `unknown.replace(/a(?<foo>b)c/, "_$<foo>_")`,
            options: [{ strictTypes: false }],
            errors: ["Unexpected indexed reference in replacement string."],
        },
        {
            code: `unknown.replaceAll(/a(?<foo>b)c/, "_$1_")`,
            output: `unknown.replaceAll(/a(?<foo>b)c/, "_$<foo>_")`,
            options: [{ strictTypes: false }],
            errors: ["Unexpected indexed reference in replacement string."],
        },
    ],
})
