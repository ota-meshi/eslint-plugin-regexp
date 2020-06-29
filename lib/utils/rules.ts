import type { RuleModule } from "../types"
import matchAny from "../rules/match-any"
import noAssertionCapturingGroup from "../rules/no-assertion-capturing-group"
import noDupeCharactersCharacterClass from "../rules/no-dupe-characters-character-class"
import noEmptyGroup from "../rules/no-empty-group"
import noEmptyLookaroundsAssertion from "../rules/no-empty-lookarounds-assertion"
import noEscapeBackspace from "../rules/no-escape-backspace"
import noOctal from "../rules/no-octal"
import noUselessExactlyQuantifier from "../rules/no-useless-exactly-quantifier"
import preferD from "../rules/prefer-d"
import preferPlusQuantifier from "../rules/prefer-plus-quantifier"
import preferQuestionQuantifier from "../rules/prefer-question-quantifier"
import preferStarQuantifier from "../rules/prefer-star-quantifier"
import preferT from "../rules/prefer-t"
import preferW from "../rules/prefer-w"

export const rules = [
    matchAny,
    noAssertionCapturingGroup,
    noDupeCharactersCharacterClass,
    noEmptyGroup,
    noEmptyLookaroundsAssertion,
    noEscapeBackspace,
    noOctal,
    noUselessExactlyQuantifier,
    preferD,
    preferPlusQuantifier,
    preferQuestionQuantifier,
    preferStarQuantifier,
    preferT,
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
