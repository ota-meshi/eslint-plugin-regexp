import assert from "node:assert"
import { ESLint } from "eslint"
import { rules as allRules } from "../../lib/configs/rules/all.ts"
import { rules as recommendedRules } from "../../lib/configs/rules/recommended.ts"
import plugin, { configs } from "../../lib/index.ts"

describe("flat configurations", () => {
    for (const [key, rules] of [
        ["recommended", recommendedRules],
        ["all", allRules],
    ] as const) {
        it(`names ${key} without changing its rules, plugin or alias`, () => {
            const config = plugin.configs[key]

            assert.strictEqual(config.name, `regexp/${key}`)
            assert.strictEqual(config.rules, rules)
            assert.strictEqual(config.plugins.regexp, plugin)
            assert.strictEqual(configs[key], config)
            assert.strictEqual(plugin.configs[`flat/${key}`], config)
        })

        for (const configKey of [key, `flat/${key}`] as const) {
            it(`lints with ${configKey}`, async () => {
                const eslint = new ESLint({
                    overrideConfigFile: true,
                    overrideConfig: [plugin.configs[configKey]],
                })
                const [result] = await eslint.lintText(
                    "const pattern = /a|a/;",
                    {
                        filePath: "test.js",
                    },
                )

                assert.ok(
                    result.messages.some(
                        (message) =>
                            message.ruleId === "regexp/no-dupe-disjunctions",
                    ),
                )
            })
        }
    }
})
