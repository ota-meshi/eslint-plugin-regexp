import fs from "fs"
import path from "path"

/**
 * Get the all rules
 * @returns {Array} The all rules
 */
function readRules() {
    const rulesLibRoot = path.resolve(__dirname, "../../lib/rules")
    const result = fs.readdirSync(rulesLibRoot)
    const rules = []
    for (const name of result) {
        const ruleName = name.replace(/\.ts$/u, "")
        const ruleId = `regexp/${ruleName}`
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- ignore
        const rule = require(path.join(rulesLibRoot, name)).default

        rule.meta.docs.ruleName = ruleName
        rule.meta.docs.ruleId = ruleId

        rules.push(rule)
    }
    return rules
}

export const rules = readRules()
