import type { RuleModule } from "../types"
import confusingQuantifier from "../rules/confusing-quantifier"
import letterCase from "../rules/letter-case"
import matchAny from "../rules/match-any"
import negation from "../rules/negation"
import noAssertionCapturingGroup from "../rules/no-assertion-capturing-group"
import noDupeCharactersCharacterClass from "../rules/no-dupe-characters-character-class"
import noDupeDisjunctions from "../rules/no-dupe-disjunctions"
import noEmptyAlternative from "../rules/no-empty-alternative"
import noEmptyGroup from "../rules/no-empty-group"
import noEmptyLookaroundsAssertion from "../rules/no-empty-lookarounds-assertion"
import noEscapeBackspace from "../rules/no-escape-backspace"
import noInvisibleCharacter from "../rules/no-invisible-character"
import noLazyEnds from "../rules/no-lazy-ends"
import noLegacyFeatures from "../rules/no-legacy-features"
import noObscureRange from "../rules/no-obscure-range"
import noOctal from "../rules/no-octal"
import noOptionalAssertion from "../rules/no-optional-assertion"
import noPotentiallyUselessBackreference from "../rules/no-potentially-useless-backreference"
import noTriviallyNestedAssertion from "../rules/no-trivially-nested-assertion"
import noUnusedCapturingGroup from "../rules/no-unused-capturing-group"
import noUnusedGlobalFlag from "../rules/no-unused-global-flag"
import noUselessAssertions from "../rules/no-useless-assertions"
import noUselessBackreference from "../rules/no-useless-backreference"
import noUselessCharacterClass from "../rules/no-useless-character-class"
import noUselessDollarReplacements from "../rules/no-useless-dollar-replacements"
import noUselessEscape from "../rules/no-useless-escape"
import noUselessExactlyQuantifier from "../rules/no-useless-exactly-quantifier"
import noUselessNonCapturingGroup from "../rules/no-useless-non-capturing-group"
import noUselessNonGreedy from "../rules/no-useless-non-greedy"
import noUselessRange from "../rules/no-useless-range"
import noUselessTwoNumsQuantifier from "../rules/no-useless-two-nums-quantifier"
import optimalLookaroundQuantifier from "../rules/optimal-lookaround-quantifier"
import orderInCharacterClass from "../rules/order-in-character-class"
import preferCharacterClass from "../rules/prefer-character-class"
import preferD from "../rules/prefer-d"
import preferEscapeReplacementDollarChar from "../rules/prefer-escape-replacement-dollar-char"
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
    confusingQuantifier,
    letterCase,
    matchAny,
    negation,
    noAssertionCapturingGroup,
    noDupeCharactersCharacterClass,
    noDupeDisjunctions,
    noEmptyAlternative,
    noEmptyGroup,
    noEmptyLookaroundsAssertion,
    noEscapeBackspace,
    noInvisibleCharacter,
    noLazyEnds,
    noLegacyFeatures,
    noObscureRange,
    noOctal,
    noOptionalAssertion,
    noPotentiallyUselessBackreference,
    noTriviallyNestedAssertion,
    noUnusedCapturingGroup,
    noUnusedGlobalFlag,
    noUselessAssertions,
    noUselessBackreference,
    noUselessCharacterClass,
    noUselessDollarReplacements,
    noUselessEscape,
    noUselessExactlyQuantifier,
    noUselessNonCapturingGroup,
    noUselessNonGreedy,
    noUselessRange,
    noUselessTwoNumsQuantifier,
    optimalLookaroundQuantifier,
    orderInCharacterClass,
    preferCharacterClass,
    preferD,
    preferEscapeReplacementDollarChar,
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
