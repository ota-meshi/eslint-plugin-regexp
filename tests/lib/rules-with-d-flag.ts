import { Linter } from "eslint"
import * as parser from "@typescript-eslint/parser"
// @ts-expect-error -- ignore
import { rules } from "../../lib/index"
import assert from "assert"

describe("Don't crash even if with d flag.", () => {
    const code = "var foo = /a/d; new RegExp('a', 'd')"

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
                },
            }
            // @ts-expect-error -- ignore
            linter.defineParser("@typescript-eslint/parser", parser)
            // @ts-expect-error -- ignore
            linter.defineRule(ruleId, rule)
            const resultVue = linter.verifyAndFix(code, config, "test.js")

            assert.deepStrictEqual(resultVue.messages, [])
        })
    }
})
