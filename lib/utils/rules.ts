import type { RuleModule } from "../types"

export const rules = [
    require("../rules/no-dupe-characters-character-class"),
] as RuleModule[]

/**
 * Get recommended config
 */
export function recommendedConfig(): { [key: string]: "error" | "warn" } {
    return rules.reduce((obj, rule) => {
        if (!rule.meta.deprecated) {
            obj[rule.meta.docs.ruleId] = rule.meta.docs.default || "error"
        }
        return obj
    }, {} as { [key: string]: "error" | "warn" })
}
