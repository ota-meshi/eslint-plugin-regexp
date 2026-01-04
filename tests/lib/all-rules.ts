import assert from "node:assert"
import fs from "node:fs"
import module from "node:module"
import path from "node:path"

import { rules as allRules } from "../../lib/all-rules.ts"
import type { RuleModule } from "../../lib/types.ts"

const require = module.createRequire(import.meta.url)

/**
 * @returns {Array} Get the list of rules placed in the directory.
 */
function getDirRules() {
    const rulesRoot = path.resolve(import.meta.dirname, "../../lib/rules")
    const result = fs.readdirSync(rulesRoot)
    const rules: { [key: string]: RuleModule } = {}
    for (const name of result) {
        const ruleName = name.replace(/\.ts$/u, "")
        const ruleId = `regexp/${ruleName}`

        const rule = require(path.join(rulesRoot, name)).default
        rules[ruleId] = rule
    }
    return rules
}

const dirRules = getDirRules()

describe("Check that all the rules have the correct names.", () => {
    for (const ruleId of Object.keys(dirRules)) {
        it(ruleId, () => {
            const rule = dirRules[ruleId]
            assert.strictEqual(rule.meta.docs.ruleId, ruleId)
        })
    }
})

describe("Check if the strict of all rules is correct", () => {
    it("rule count equals", () => {
        assert.ok(
            allRules.length === Object.keys(dirRules).length,
            `Did not equal the number of rules. expect:${
                Object.keys(dirRules).length
            } actual:${allRules.length}`,
        )
    })

    for (const rule of allRules) {
        it(rule.meta.docs.ruleId, () => {
            assert.ok(Boolean(rule.meta.docs.ruleId), "Did not set `ruleId`")
            assert.ok(
                Boolean(rule.meta.docs.ruleName),
                "Did not set `ruleName`",
            )
            assert.ok(
                Boolean(dirRules[rule.meta.docs.ruleId]),
                "Did not exist rule",
            )
        })

        describe("Check if the messages are correct", () => {
            describe(rule.meta.docs.ruleId, () => {
                for (const messageId of Object.keys(rule.meta.messages)) {
                    it(messageId, () => {
                        const message = rule.meta.messages[messageId]
                        assert.ok(
                            /(?:[.?]|\}\})\)?$/u.test(message),
                            "Doesn't end with a dot.",
                        )
                    })
                }
            })
        })
    }
})
