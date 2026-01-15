import confusingQuantifier from "./rules/confusing-quantifier.ts"
import controlCharacterEscape from "./rules/control-character-escape.ts"
import graphemeStringLiteral from "./rules/grapheme-string-literal.ts"
import hexadecimalEscape from "./rules/hexadecimal-escape.ts"
import letterCase from "./rules/letter-case.ts"
import matchAny from "./rules/match-any.ts"
import negation from "./rules/negation.ts"
import noContradictionWithAssertion from "./rules/no-contradiction-with-assertion.ts"
import noControlCharacter from "./rules/no-control-character.ts"
import noDupeCharactersCharacterClass from "./rules/no-dupe-characters-character-class.ts"
import noDupeDisjunctions from "./rules/no-dupe-disjunctions.ts"
import noEmptyAlternative from "./rules/no-empty-alternative.ts"
import noEmptyCapturingGroup from "./rules/no-empty-capturing-group.ts"
import noEmptyCharacterClass from "./rules/no-empty-character-class.ts"
import noEmptyGroup from "./rules/no-empty-group.ts"
import noEmptyLookaroundsAssertion from "./rules/no-empty-lookarounds-assertion.ts"
import noEmptyStringLiteral from "./rules/no-empty-string-literal.ts"
import noEscapeBackspace from "./rules/no-escape-backspace.ts"
import noExtraLookaroundAssertions from "./rules/no-extra-lookaround-assertions.ts"
import noInvalidRegexp from "./rules/no-invalid-regexp.ts"
import noInvisibleCharacter from "./rules/no-invisible-character.ts"
import noLazyEnds from "./rules/no-lazy-ends.ts"
import noLegacyFeatures from "./rules/no-legacy-features.ts"
import noMisleadingCapturingGroup from "./rules/no-misleading-capturing-group.ts"
import noMisleadingUnicodeCharacter from "./rules/no-misleading-unicode-character.ts"
import noMissingGFlag from "./rules/no-missing-g-flag.ts"
import noNonStandardFlag from "./rules/no-non-standard-flag.ts"
import noObscureRange from "./rules/no-obscure-range.ts"
import noOctal from "./rules/no-octal.ts"
import noOptionalAssertion from "./rules/no-optional-assertion.ts"
import noPotentiallyUselessBackreference from "./rules/no-potentially-useless-backreference.ts"
import noStandaloneBackslash from "./rules/no-standalone-backslash.ts"
import noSuperLinearBacktracking from "./rules/no-super-linear-backtracking.ts"
import noSuperLinearMove from "./rules/no-super-linear-move.ts"
import noTriviallyNestedAssertion from "./rules/no-trivially-nested-assertion.ts"
import noTriviallyNestedQuantifier from "./rules/no-trivially-nested-quantifier.ts"
import noUnusedCapturingGroup from "./rules/no-unused-capturing-group.ts"
import noUselessAssertions from "./rules/no-useless-assertions.ts"
import noUselessBackreference from "./rules/no-useless-backreference.ts"
import noUselessCharacterClass from "./rules/no-useless-character-class.ts"
import noUselessDollarReplacements from "./rules/no-useless-dollar-replacements.ts"
import noUselessEscape from "./rules/no-useless-escape.ts"
import noUselessFlag from "./rules/no-useless-flag.ts"
import noUselessLazy from "./rules/no-useless-lazy.ts"
import noUselessNonCapturingGroup from "./rules/no-useless-non-capturing-group.ts"
import noUselessQuantifier from "./rules/no-useless-quantifier.ts"
import noUselessRange from "./rules/no-useless-range.ts"
import noUselessSetOperand from "./rules/no-useless-set-operand.ts"
import noUselessStringLiteral from "./rules/no-useless-string-literal.ts"
import noUselessTwoNumsQuantifier from "./rules/no-useless-two-nums-quantifier.ts"
import noZeroQuantifier from "./rules/no-zero-quantifier.ts"
import optimalLookaroundQuantifier from "./rules/optimal-lookaround-quantifier.ts"
import optimalQuantifierConcatenation from "./rules/optimal-quantifier-concatenation.ts"
import preferCharacterClass from "./rules/prefer-character-class.ts"
import preferD from "./rules/prefer-d.ts"
import preferEscapeReplacementDollarChar from "./rules/prefer-escape-replacement-dollar-char.ts"
import preferLookaround from "./rules/prefer-lookaround.ts"
import preferNamedBackreference from "./rules/prefer-named-backreference.ts"
import preferNamedCaptureGroup from "./rules/prefer-named-capture-group.ts"
import preferNamedReplacement from "./rules/prefer-named-replacement.ts"
import preferPlusQuantifier from "./rules/prefer-plus-quantifier.ts"
import preferPredefinedAssertion from "./rules/prefer-predefined-assertion.ts"
import preferQuantifier from "./rules/prefer-quantifier.ts"
import preferQuestionQuantifier from "./rules/prefer-question-quantifier.ts"
import preferRange from "./rules/prefer-range.ts"
import preferRegexpExec from "./rules/prefer-regexp-exec.ts"
import preferRegexpTest from "./rules/prefer-regexp-test.ts"
import preferResultArrayGroups from "./rules/prefer-result-array-groups.ts"
import preferSetOperation from "./rules/prefer-set-operation.ts"
import preferStarQuantifier from "./rules/prefer-star-quantifier.ts"
import preferUnicodeCodepointEscapes from "./rules/prefer-unicode-codepoint-escapes.ts"
import preferW from "./rules/prefer-w.ts"
import requireUnicodeRegexp from "./rules/require-unicode-regexp.ts"
import requireUnicodeSetsRegexp from "./rules/require-unicode-sets-regexp.ts"
import simplifySetOperations from "./rules/simplify-set-operations.ts"
import sortAlternatives from "./rules/sort-alternatives.ts"
import sortCharacterClassElements from "./rules/sort-character-class-elements.ts"
import sortFlags from "./rules/sort-flags.ts"
import strict from "./rules/strict.ts"
import unicodeEscape from "./rules/unicode-escape.ts"
import unicodeProperty from "./rules/unicode-property.ts"
import useIgnoreCase from "./rules/use-ignore-case.ts"
import type { RuleModule } from "./types.ts"

export const rules: RuleModule[] = [
    confusingQuantifier,
    controlCharacterEscape,
    graphemeStringLiteral,
    hexadecimalEscape,
    letterCase,
    matchAny,
    negation,
    noContradictionWithAssertion,
    noControlCharacter,
    noDupeCharactersCharacterClass,
    noDupeDisjunctions,
    noEmptyAlternative,
    noEmptyCapturingGroup,
    noEmptyCharacterClass,
    noEmptyGroup,
    noEmptyLookaroundsAssertion,
    noEmptyStringLiteral,
    noEscapeBackspace,
    noExtraLookaroundAssertions,
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
    noUselessFlag,
    noUselessLazy,
    noUselessNonCapturingGroup,
    noUselessQuantifier,
    noUselessRange,
    noUselessSetOperand,
    noUselessStringLiteral,
    noUselessTwoNumsQuantifier,
    noZeroQuantifier,
    optimalLookaroundQuantifier,
    optimalQuantifierConcatenation,
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
    preferSetOperation,
    preferStarQuantifier,
    preferUnicodeCodepointEscapes,
    preferW,
    requireUnicodeRegexp,
    requireUnicodeSetsRegexp,
    simplifySetOperations,
    sortAlternatives,
    sortCharacterClassElements,
    sortFlags,
    strict,
    unicodeEscape,
    unicodeProperty,
    useIgnoreCase,
]
