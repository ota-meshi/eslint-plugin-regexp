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

describe("Don't crash even if with d flag.", () => {
    const code = "var foo = /a/d; new RegExp('a', 'd')"

    const RULE_SPECIFIC: Record<
        string,
        { ruleId: string; message: string }[] | undefined
    > = {
        "regexp/no-non-standard-flags": [
            { ruleId: "regexp/test", message: "Foo" },
            {
                ruleId: "regexp/no-non-standard-flags",
                message: "Unexpected non-standard flag 'd'.",
            },
            { ruleId: "regexp/test", message: "Foo" },
            {
                ruleId: "regexp/no-non-standard-flags",
                message: "Unexpected non-standard flag 'd'.",
            },
        ],
    }

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
                RULE_SPECIFIC[ruleId] ?? [
                    { ruleId: "regexp/test", message: "Foo" },
                    { ruleId: "regexp/test", message: "Foo" },
                ],
            )
        })
    }
})
