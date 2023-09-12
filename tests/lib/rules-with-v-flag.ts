import { Linter } from "eslint"
import * as parser from "@typescript-eslint/parser"
import { rules } from "../../lib/index"
import assert from "assert"

describe("Don't crash even if with v flag.", () => {
    const pattern = String.raw`^(a|b)(?:c|d)[e-f][[g--[h&&i]][j]\q{k}](?=l)(?!m)(?<=n)(?<!o)p+\1\b.\d\s\w\p{ASCII}$`
    const code = [
        (p: string, flag: string) => `export const ${flag} = /${p}/${flag}`,
        (p: string, flag: string) =>
            `new RegExp(${JSON.stringify(p)}, ${JSON.stringify(flag)})`,
    ]
        .flatMap((f) => [f(pattern, "v"), f(pattern, "iv")])
        .join(";\n")

    const RULE_SPECIFIC: Record<string, string[] | number | undefined> = {
        "regexp/no-non-standard-flag": Array(4).fill(
            "Unexpected non-standard flag 'v'.",
        ),
        "regexp/no-useless-assertions": 20,
        "regexp/order-in-character-class": 8,
        "regexp/prefer-named-capture-group": Array(4).fill(
            "Capture group '(a|b)' should be converted to a named or non-capturing group.",
        ),
        "regexp/require-unicode-regexp": Array(4).fill("Use the 'u' flag."),
        "regexp/sort-character-class-elements": 8,
        "regexp/strict": Array(4).fill(
            "Invalid regular expression: /^(a|b)(?:c|d)[e-f][[g--[h&&i]][j]\\q{k}](?=l)(?!m)(?<=n)(?<!o)p+\\1\\b.\\d\\s\\w\\p{ASCII}$/: Range out of order in character class.",
        ),
    }

    for (const key of Object.keys(rules)) {
        const rule = rules[key]
        const ruleId = rule.meta.docs.ruleId

        it(ruleId, () => {
            const linter = new Linter()
            const config: Linter.Config = {
                parser: "@typescript-eslint/parser",
                parserOptions: {
                    ecmaVersion: "latest",
                    sourceType: "module",
                },
                rules: {
                    [ruleId]: "error",
                },
            }
            // @ts-expect-error -- ignore
            linter.defineParser("@typescript-eslint/parser", parser)
            linter.defineRule(ruleId, rule)

            const resultVue = linter.verifyAndFix(code, config, "test.js")

            const expected = RULE_SPECIFIC[ruleId] ?? []
            if (Array.isArray(expected)) {
                assert.deepStrictEqual(
                    resultVue.messages.map((m) => ({
                        ruleId: m.ruleId,
                        message: m.message,
                    })),
                    expected.map((message) => ({
                        ruleId,
                        message,
                    })),
                )
            } else {
                assert.deepStrictEqual(
                    resultVue.messages.map((m) => ({
                        ruleId: m.ruleId,
                    })),
                    Array(expected).fill({ ruleId }),
                )
            }
        })
    }
})

// describe("Don't crash even if with unknown flag in core rules", () => {
//     const code = "var foo = /a/abcdefgg;\n new RegExp('a', 'abcdefgg')"

//     for (const ruleId of new Set([
//         ...Object.keys(configs.recommended.rules),
//         "no-empty-character-class",
//     ])) {
//         if (ruleId.startsWith("regexp/")) {
//             continue
//         }

//         it(ruleId, () => {
//             const linter = new Linter()
//             const config: Linter.Config = {
//                 parser: "@typescript-eslint/parser",
//                 parserOptions: {
//                     ecmaVersion: 2020,
//                 },
//                 rules: {
//                     [ruleId]: "error",
//                 },
//             }
//             // @ts-expect-error -- ignore
//             linter.defineParser("@typescript-eslint/parser", parser)
//             const resultVue = linter.verifyAndFix(code, config, "test.js")

//             const msgs = resultVue.messages.map((m) => ({
//                 ruleId: m.ruleId,
//                 line: m.line,
//             }))
//             if (ruleId === "no-invalid-regexp") {
//                 assert.deepStrictEqual(msgs, [
//                     { ruleId: "no-invalid-regexp", line: 2 },
//                 ])
//             } else if (ruleId === "prefer-regex-literals") {
//                 assert.deepStrictEqual(msgs, [
//                     { ruleId: "prefer-regex-literals", line: 2 },
//                 ])
//             } else {
//                 assert.deepStrictEqual(msgs, [])
//             }
//         })
//     }
// })
