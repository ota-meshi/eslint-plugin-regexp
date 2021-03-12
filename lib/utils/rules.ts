import type { RuleModule } from "../types"
import letterCase from "../rules/letter-case"
import matchAny from "../rules/match-any"
import negation from "../rules/negation"
import noAssertionCapturingGroup from "../rules/no-assertion-capturing-group"
import noDupeCharactersCharacterClass from "../rules/no-dupe-characters-character-class"
import noDupeDisjunctions from "../rules/no-dupe-disjunctions"
import noEmptyGroup from "../rules/no-empty-group"
import noEmptyLookaroundsAssertion from "../rules/no-empty-lookarounds-assertion"
import noEscapeBackspace from "../rules/no-escape-backspace"
import noInvisibleCharacter from "../rules/no-invisible-character"
import noOctal from "../rules/no-octal"
import noUselessBackreference from "../rules/no-useless-backreference"
import noUselessCharacterClass from "../rules/no-useless-character-class"
import noUselessEscape from "../rules/no-useless-escape"
import noUselessExactlyQuantifier from "../rules/no-useless-exactly-quantifier"
import noUselessNonCapturingGroup from "../rules/no-useless-non-capturing-group"
import noUselessNonGreedy from "../rules/no-useless-non-greedy"
import noUselessRange from "../rules/no-useless-range"
import noUselessTwoNumsQuantifier from "../rules/no-useless-two-nums-quantifier"
import orderInCharacterClass from "../rules/order-in-character-class"
import preferCharacterClass from "../rules/prefer-character-class"
import preferD from "../rules/prefer-d"
import preferPlusQuantifier from "../rules/prefer-plus-quantifier"
import preferQuantifier from "../rules/prefer-quantifier"
import preferQuestionQuantifier from "../rules/prefer-question-quantifier"
import preferRange from "../rules/prefer-range"
import preferRegexpExec from "../rules/prefer-regexp-exec"
import preferRegexpTest from "../rules/prefer-regexp-test"
import preferStarQuantifier from "../rules/prefer-star-quantifier"
import preferT from "../rules/prefer-t"
import preferUnicodeCodepointEscapes from "../rules/prefer-unicode-codepoint-escapes"
import preferW from "../rules/prefer-w"

export const rules = [
    letterCase,
    matchAny,
    negation,
    noAssertionCapturingGroup,
    noDupeCharactersCharacterClass,
    noDupeDisjunctions,
    noEmptyGroup,
    noEmptyLookaroundsAssertion,
    noEscapeBackspace,
    noInvisibleCharacter,
    noOctal,
    noUselessBackreference,
    noUselessCharacterClass,
    noUselessEscape,
    noUselessExactlyQuantifier,
    noUselessNonCapturingGroup,
    noUselessNonGreedy,
    noUselessRange,
    noUselessTwoNumsQuantifier,
    orderInCharacterClass,
    preferCharacterClass,
    preferD,
    preferPlusQuantifier,
    preferQuantifier,
    preferQuestionQuantifier,
    preferRange,
    preferRegexpExec,
    preferRegexpTest,
    preferStarQuantifier,
    preferT,
    preferUnicodeCodepointEscapes,
    preferW,
] as RuleModule[]
