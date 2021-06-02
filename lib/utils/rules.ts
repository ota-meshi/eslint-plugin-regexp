import type { RuleModule } from "../types"
import confusingQuantifier from "../rules/confusing-quantifier"
import controlCharacterEscape from "../rules/control-character-escape"
import hexadecimalEscape from "../rules/hexadecimal-escape"
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
import noNonStandardFlag from "../rules/no-non-standard-flag"
import noObscureRange from "../rules/no-obscure-range"
import noOctal from "../rules/no-octal"
import noOptionalAssertion from "../rules/no-optional-assertion"
import noPotentiallyUselessBackreference from "../rules/no-potentially-useless-backreference"
import noStandaloneBackslash from "../rules/no-standalone-backslash"
import noTriviallyNestedAssertion from "../rules/no-trivially-nested-assertion"
import noTriviallyNestedQuantifier from "../rules/no-trivially-nested-quantifier"
import noUnusedCapturingGroup from "../rules/no-unused-capturing-group"
import noUselessAssertions from "../rules/no-useless-assertions"
import noUselessBackreference from "../rules/no-useless-backreference"
import noUselessCharacterClass from "../rules/no-useless-character-class"
import noUselessDollarReplacements from "../rules/no-useless-dollar-replacements"
import noUselessEscape from "../rules/no-useless-escape"
import noUselessExactlyQuantifier from "../rules/no-useless-exactly-quantifier"
import noUselessFlag from "../rules/no-useless-flag"
import noUselessLazy from "../rules/no-useless-lazy"
import noUselessNonCapturingGroup from "../rules/no-useless-non-capturing-group"
import noUselessNonGreedy from "../rules/no-useless-non-greedy"
import noUselessQuantifier from "../rules/no-useless-quantifier"
import noUselessRange from "../rules/no-useless-range"
import noUselessTwoNumsQuantifier from "../rules/no-useless-two-nums-quantifier"
import noZeroQuantifier from "../rules/no-zero-quantifier"
import optimalLookaroundQuantifier from "../rules/optimal-lookaround-quantifier"
import optimalQuantifierConcatenation from "../rules/optimal-quantifier-concatenation"
import orderInCharacterClass from "../rules/order-in-character-class"
import preferCharacterClass from "../rules/prefer-character-class"
import preferD from "../rules/prefer-d"
import preferEscapeReplacementDollarChar from "../rules/prefer-escape-replacement-dollar-char"
import preferNamedBackreference from "../rules/prefer-named-backreference"
import preferPlusQuantifier from "../rules/prefer-plus-quantifier"
import preferPredefinedAssertion from "../rules/prefer-predefined-assertion"
import preferQuantifier from "../rules/prefer-quantifier"
import preferQuestionQuantifier from "../rules/prefer-question-quantifier"
import preferRange from "../rules/prefer-range"
import preferRegexpExec from "../rules/prefer-regexp-exec"
import preferRegexpTest from "../rules/prefer-regexp-test"
import preferStarQuantifier from "../rules/prefer-star-quantifier"
import preferT from "../rules/prefer-t"
import preferUnicodeCodepointEscapes from "../rules/prefer-unicode-codepoint-escapes"
import preferW from "../rules/prefer-w"
import sortFlags from "../rules/sort-flags"
import strict from "../rules/strict"
import unicodeEscape from "../rules/unicode-escape"

export const rules = [
    confusingQuantifier,
    controlCharacterEscape,
    hexadecimalEscape,
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
    noNonStandardFlag,
    noObscureRange,
    noOctal,
    noOptionalAssertion,
    noPotentiallyUselessBackreference,
    noStandaloneBackslash,
    noTriviallyNestedAssertion,
    noTriviallyNestedQuantifier,
    noUnusedCapturingGroup,
    noUselessAssertions,
    noUselessBackreference,
    noUselessCharacterClass,
    noUselessDollarReplacements,
    noUselessEscape,
    noUselessExactlyQuantifier,
    noUselessFlag,
    noUselessLazy,
    noUselessNonCapturingGroup,
    noUselessNonGreedy,
    noUselessQuantifier,
    noUselessRange,
    noUselessTwoNumsQuantifier,
    noZeroQuantifier,
    optimalLookaroundQuantifier,
    optimalQuantifierConcatenation,
    orderInCharacterClass,
    preferCharacterClass,
    preferD,
    preferEscapeReplacementDollarChar,
    preferNamedBackreference,
    preferPlusQuantifier,
    preferPredefinedAssertion,
    preferQuantifier,
    preferQuestionQuantifier,
    preferRange,
    preferRegexpExec,
    preferRegexpTest,
    preferStarQuantifier,
    preferT,
    preferUnicodeCodepointEscapes,
    preferW,
    sortFlags,
    strict,
    unicodeEscape,
] as RuleModule[]
