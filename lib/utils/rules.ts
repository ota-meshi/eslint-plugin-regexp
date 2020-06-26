import type { RuleModule } from "../types"
import matchAny from "../rules/match-any"
import noDupeCharactersCharacterClass from "../rules/no-dupe-characters-character-class"
import preferD from "../rules/prefer-d"
import preferW from "../rules/prefer-w"

export const rules = [
    matchAny,
    noDupeCharactersCharacterClass,
    preferD,
    preferW,
] as RuleModule[]

/**
 * Get recommended config
 */
export function recommendedConfig(): { [key: string]: "error" | "warn" } {
    return rules.reduce((obj, rule) => {
        if (rule.meta.docs.recommended && !rule.meta.deprecated) {
            obj[rule.meta.docs.ruleId] = rule.meta.docs.default || "error"
        }
        return obj
    }, {} as { [key: string]: "error" | "warn" })
}
