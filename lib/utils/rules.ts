import type { RuleModule } from "../types"
import matchAny from "../rules/match-any"
import noAssertionCapturingGroup from "../rules/no-assertion-capturing-group"
import noDupeCharactersCharacterClass from "../rules/no-dupe-characters-character-class"
import noEmptyGroup from "../rules/no-empty-group"
import noEmptyLookaroundsAssertion from "../rules/no-empty-lookarounds-assertion"
import noEscapeBackspace from "../rules/no-escape-backspace"
import noInvisibleCharacter from "../rules/no-invisible-character"
import noOctal from "../rules/no-octal"
import noUselessBackreference from "../rules/no-useless-backreference"
import noUselessExactlyQuantifier from "../rules/no-useless-exactly-quantifier"
import noUselessTwoNumsQuantifier from "../rules/no-useless-two-nums-quantifier"
import preferD from "../rules/prefer-d"
import preferPlusQuantifier from "../rules/prefer-plus-quantifier"
import preferQuantifier from "../rules/prefer-quantifier"
import preferQuestionQuantifier from "../rules/prefer-question-quantifier"
import preferStarQuantifier from "../rules/prefer-star-quantifier"
import preferT from "../rules/prefer-t"
import preferUnicodeCodepointEscapes from "../rules/prefer-unicode-codepoint-escapes"
import preferW from "../rules/prefer-w"

export const rules = [
    matchAny,
    noAssertionCapturingGroup,
    noDupeCharactersCharacterClass,
    noEmptyGroup,
    noEmptyLookaroundsAssertion,
    noEscapeBackspace,
    noInvisibleCharacter,
    noOctal,
    noUselessBackreference,
    noUselessExactlyQuantifier,
    noUselessTwoNumsQuantifier,
    preferD,
    preferPlusQuantifier,
    preferQuantifier,
    preferQuestionQuantifier,
    preferStarQuantifier,
    preferT,
    preferUnicodeCodepointEscapes,
    preferW,
] as RuleModule[]
