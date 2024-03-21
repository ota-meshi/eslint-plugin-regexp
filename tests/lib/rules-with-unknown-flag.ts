import assert from "assert"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import * as parser from "@typescript-eslint/parser"
import { Linter } from "eslint"
import { rules } from "../../lib/index"
import type { RegExpContext } from "../../lib/utils"
import { createRule, defineRegexpVisitor } from "../../lib/utils"

const TEST_RULE = createRule("test", {
    meta: {
        docs: {
            description: "",
            category: "Best Practices",
            recommended: false,
        },
        schema: [],
        messages: {},
        type: "suggestion", // "problem",
    },

    create(context) {
        function createVisitor({
            node,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onPatternEnter() {
                    context.report({
                        node,
                        message: "Foo",
                    })
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})

describe("Don't crash even if with unknown flag.", () => {
    const code = "var foo = /a/abcdefgg; new RegExp('a', 'abcdefgg')"

    const RULE_SPECIFIC: Record<
        string,
        { ruleId: string; message: string }[] | undefined
    > = {
        "regexp/no-non-standard-flag": [
            { ruleId: "regexp/test", message: "Foo" },
            {
                ruleId: "regexp/no-non-standard-flag",
                message: "Unexpected non-standard flag 'a'.",
            },
            { ruleId: "regexp/test", message: "Foo" },
            {
                ruleId: "regexp/no-non-standard-flag",
                message: "Unexpected non-standard flag 'a'.",
            },
        ],
    }

    const pluginRules = Object.fromEntries(
        Object.values(rules).map((rule) => [rule.meta.docs.ruleName, rule]),
    )

    for (const rule of Object.values(rules)) {
        const ruleId = rule.meta.docs.ruleId

        it(ruleId, () => {
            const linter = new Linter({ configType: "flat" })
            const config: Linter.Config = {
                plugins: {
                    // @ts-expect-error -- ignore type error for eslint v9
                    regexp: {
                        rules: { ...pluginRules, test: TEST_RULE },
                    },
                },
                languageOptions: {
                    parser,
                    ecmaVersion: 2020,
                },
                rules: {
                    [ruleId]: "error",
                    "regexp/test": "error",
                    ...(ruleId === "regexp/require-unicode-sets-regexp"
                        ? { "regexp/require-unicode-regexp": "error" }
                        : {}),
                },
            }

            const resultVue = linter.verifyAndFix(code, config, "test.js")

            assert.deepStrictEqual(
                resultVue.messages.map((m) => ({
                    ruleId: m.ruleId,
                    message: m.message,
                })),
                RULE_SPECIFIC[ruleId] ?? [
                    { ruleId: "regexp/test", message: "Foo" },
                    { ruleId: "regexp/test", message: "Foo" },
                ],
            )
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
