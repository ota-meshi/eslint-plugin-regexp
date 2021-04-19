import { Linter } from "eslint"
import * as parser from "@typescript-eslint/parser"
// @ts-expect-error -- ignore
import { rules } from "../../lib/index"
import assert from "assert"
import type { RegExpContext } from "../../lib/utils"
import { createRule, defineRegexpVisitor } from "../../lib/utils"
import type { RegExpVisitor } from "regexpp/visitor"

const TEST_RULE = createRule("test", {
    meta: {
        docs: {
            description: "",
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

    for (const key of Object.keys(rules)) {
        const rule = rules[key]
        const ruleId = rule.meta.docs.ruleId

        it(ruleId, () => {
            const linter = new Linter()
            const config: Linter.Config = {
                parser: "@typescript-eslint/parser",
                parserOptions: {
                    ecmaVersion: 2020,
                },
                rules: {
                    [ruleId]: "error",
                    "regexp/test": "error",
                },
            }
            // @ts-expect-error -- ignore
            linter.defineParser("@typescript-eslint/parser", parser)
            linter.defineRule(ruleId, rule)

            linter.defineRule("regexp/test", TEST_RULE)
            const resultVue = linter.verifyAndFix(code, config, "test.js")

            assert.deepStrictEqual(
                resultVue.messages.map((m) => ({
                    ruleId: m.ruleId,
                    message: m.message,
                })),
                [
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
