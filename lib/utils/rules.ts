import type { RuleModule } from "../types"
import confusingQuantifier from "../rules/confusing-quantifier"
import controlCharacterEscape from "../rules/control-character-escape"
import hexadecimalEscape from "../rules/hexadecimal-escape"
import letterCase from "../rules/letter-case"
import matchAny from "../rules/match-any"
import negation from "../rules/negation"
import noAssertionCapturingGroup from "../rules/no-assertion-capturing-group"
import noContradictionWithAssertion from "../rules/no-contradiction-with-assertion"
import noControlCharacter from "../rules/no-control-character"
import noDupeCharactersCharacterClass from "../rules/no-dupe-characters-character-class"
import noDupeDisjunctions from "../rules/no-dupe-disjunctions"
import noEmptyAlternative from "../rules/no-empty-alternative"
import noEmptyCapturingGroup from "../rules/no-empty-capturing-group"
import noEmptyCharacterClass from "../rules/no-empty-character-class"
import noEmptyGroup from "../rules/no-empty-group"
import noEmptyLookaroundsAssertion from "../rules/no-empty-lookarounds-assertion"
import noEscapeBackspace from "../rules/no-escape-backspace"
import noInvalidRegexp from "../rules/no-invalid-regexp"
import noInvisibleCharacter from "../rules/no-invisible-character"
import noLazyEnds from "../rules/no-lazy-ends"
import noLegacyFeatures from "../rules/no-legacy-features"
import noMisleadingCapturingGroup from "../rules/no-misleading-capturing-group"
import noMisleadingUnicodeCharacter from "../rules/no-misleading-unicode-character"
import noMissingGFlag from "../rules/no-missing-g-flag"
import noNonStandardFlag from "../rules/no-non-standard-flag"
import noObscureRange from "../rules/no-obscure-range"
import noOctal from "../rules/no-octal"
import noOptionalAssertion from "../rules/no-optional-assertion"
import noPotentiallyUselessBackreference from "../rules/no-potentially-useless-backreference"
import noStandaloneBackslash from "../rules/no-standalone-backslash"
import noSuperLinearBacktracking from "../rules/no-super-linear-backtracking"
import noSuperLinearMove from "../rules/no-super-linear-move"
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
import preferLookaround from "../rules/prefer-lookaround"
import preferNamedBackreference from "../rules/prefer-named-backreference"
import preferNamedCaptureGroup from "../rules/prefer-named-capture-group"
import preferNamedReplacement from "../rules/prefer-named-replacement"
import preferPlusQuantifier from "../rules/prefer-plus-quantifier"
import preferPredefinedAssertion from "../rules/prefer-predefined-assertion"
import preferQuantifier from "../rules/prefer-quantifier"
import preferQuestionQuantifier from "../rules/prefer-question-quantifier"
import preferRange from "../rules/prefer-range"
import preferRegexpExec from "../rules/prefer-regexp-exec"
import preferRegexpTest from "../rules/prefer-regexp-test"
import preferResultArrayGroups from "../rules/prefer-result-array-groups"
import preferStarQuantifier from "../rules/prefer-star-quantifier"
import preferT from "../rules/prefer-t"
import preferUnicodeCodepointEscapes from "../rules/prefer-unicode-codepoint-escapes"
import preferW from "../rules/prefer-w"
import requireUnicodeRegexp from "../rules/require-unicode-regexp"
import sortAlternatives from "../rules/sort-alternatives"
import sortCharacterClassElements from "../rules/sort-character-class-elements"
import sortFlags from "../rules/sort-flags"
import strict from "../rules/strict"
import unicodeEscape from "../rules/unicode-escape"
import useIgnoreCase from "../rules/use-ignore-case"

export const rules = [
    confusingQuantifier,
    controlCharacterEscape,
    hexadecimalEscape,
    letterCase,
    matchAny,
    negation,
    noAssertionCapturingGroup,
    noContradictionWithAssertion,
    noControlCharacter,
    noDupeCharactersCharacterClass,
    noDupeDisjunctions,
    noEmptyAlternative,
    noEmptyCapturingGroup,
    noEmptyCharacterClass,
    noEmptyGroup,
    noEmptyLookaroundsAssertion,
    noEscapeBackspace,
    noInvalidRegexp,
    noInvisibleCharacter,
    noLazyEnds,
    noLegacyFeatures,
    noMisleadingCapturingGroup,
    noMisleadingUnicodeCharacter,
    noMissingGFlag,
    noNonStandardFlag,
    noObscureRange,
    noOctal,
    noOptionalAssertion,
    noPotentiallyUselessBackreference,
    noStandaloneBackslash,
    noSuperLinearBacktracking,
    noSuperLinearMove,
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
    preferLookaround,
    preferNamedBackreference,
    preferNamedCaptureGroup,
    preferNamedReplacement,
    preferPlusQuantifier,
    preferPredefinedAssertion,
    preferQuantifier,
    preferQuestionQuantifier,
    preferRange,
    preferRegexpExec,
    preferRegexpTest,
    preferResultArrayGroups,
    preferStarQuantifier,
    preferT,
    preferUnicodeCodepointEscapes,
    preferW,
    requireUnicodeRegexp,
    sortAlternatives,
    sortCharacterClassElements,
    sortFlags,
    strict,
    unicodeEscape,
    useIgnoreCase,
] as RuleModule[]
