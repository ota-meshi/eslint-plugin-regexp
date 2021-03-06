import type { RuleModule } from "../types"
import letterCase from "../rules/letter-case"
import matchAny from "../rules/match-any"
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
import noUselessExactlyQuantifier from "../rules/no-useless-exactly-quantifier"
import noUselessNonGreedy from "../rules/no-useless-non-greedy"
import noUselessRange from "../rules/no-useless-range"
import noUselessTwoNumsQuantifier from "../rules/no-useless-two-nums-quantifier"
import preferD from "../rules/prefer-d"
import preferPlusQuantifier from "../rules/prefer-plus-quantifier"
import preferQuantifier from "../rules/prefer-quantifier"
import preferQuestionQuantifier from "../rules/prefer-question-quantifier"
import preferRegexpExec from "../rules/prefer-regexp-exec"
import preferRegexpTest from "../rules/prefer-regexp-test"
import preferStarQuantifier from "../rules/prefer-star-quantifier"
import preferT from "../rules/prefer-t"
import preferUnicodeCodepointEscapes from "../rules/prefer-unicode-codepoint-escapes"
import preferW from "../rules/prefer-w"

export const rules = [
    letterCase,
    matchAny,
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
    noUselessExactlyQuantifier,
    noUselessNonGreedy,
    noUselessRange,
    noUselessTwoNumsQuantifier,
    preferD,
    preferPlusQuantifier,
    preferQuantifier,
    preferQuestionQuantifier,
    preferRegexpExec,
    preferRegexpTest,
    preferStarQuantifier,
    preferT,
    preferUnicodeCodepointEscapes,
    preferW,
] as RuleModule[]
