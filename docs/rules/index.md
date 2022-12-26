---
sidebarDepth: 0
---

# Available Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
⚠️ Configurations set to warn in.\
✅ Set in the `plugin:regexp/recommended` configuration.\
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions).\
❌ Deprecated.

## Possible Errors

| Name                                                                                             | Description                                                                             | 💼 | ⚠️ | 🔧 | 💡 | ❌  |
| :----------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :- | :- | :- | :- | :- |
| [no-contradiction-with-assertion](../../docs/rules/no-contradiction-with-assertion.md)           | disallow elements that contradict assertions                                            |    |    |    | 💡 |    |
| [no-control-character](../../docs/rules/no-control-character.md)                                 | disallow control characters                                                             |    |    |    | 💡 |    |
| [no-dupe-disjunctions](../../docs/rules/no-dupe-disjunctions.md)                                 | disallow duplicate disjunctions                                                         | ✅  |    |    | 💡 |    |
| [no-empty-alternative](../../docs/rules/no-empty-alternative.md)                                 | disallow alternatives without elements                                                  |    | ✅  |    |    |    |
| [no-empty-capturing-group](../../docs/rules/no-empty-capturing-group.md)                         | disallow capturing group that captures empty.                                           | ✅  |    |    |    |    |
| [no-empty-character-class](../../docs/rules/no-empty-character-class.md)                         | disallow character classes that match no characters                                     |    |    |    |    |    |
| [no-empty-group](../../docs/rules/no-empty-group.md)                                             | disallow empty group                                                                    | ✅  |    |    |    |    |
| [no-empty-lookarounds-assertion](../../docs/rules/no-empty-lookarounds-assertion.md)             | disallow empty lookahead assertion or empty lookbehind assertion                        | ✅  |    |    |    |    |
| [no-escape-backspace](../../docs/rules/no-escape-backspace.md)                                   | disallow escape backspace (`[\b]`)                                                      | ✅  |    |    |    |    |
| [no-invalid-regexp](../../docs/rules/no-invalid-regexp.md)                                       | disallow invalid regular expression strings in `RegExp` constructors                    | ✅  |    |    |    |    |
| [no-lazy-ends](../../docs/rules/no-lazy-ends.md)                                                 | disallow lazy quantifiers at the end of an expression                                   |    | ✅  |    |    |    |
| [no-misleading-unicode-character](../../docs/rules/no-misleading-unicode-character.md)           | disallow multi-code-point characters in character classes and quantifiers               |    |    | 🔧 | 💡 |    |
| [no-missing-g-flag](../../docs/rules/no-missing-g-flag.md)                                       | disallow missing `g` flag in patterns used in `String#matchAll` and `String#replaceAll` |    |    | 🔧 |    |    |
| [no-optional-assertion](../../docs/rules/no-optional-assertion.md)                               | disallow optional assertions                                                            | ✅  |    |    |    |    |
| [no-potentially-useless-backreference](../../docs/rules/no-potentially-useless-backreference.md) | disallow backreferences that reference a group that might not be matched                |    | ✅  |    |    |    |
| [no-super-linear-backtracking](../../docs/rules/no-super-linear-backtracking.md)                 | disallow exponential and polynomial backtracking                                        | ✅  |    | 🔧 |    |    |
| [no-super-linear-move](../../docs/rules/no-super-linear-move.md)                                 | disallow quantifiers that cause quadratic moves                                         |    |    |    |    |    |
| [no-useless-assertions](../../docs/rules/no-useless-assertions.md)                               | disallow assertions that are known to always accept (or reject)                         | ✅  |    |    |    |    |
| [no-useless-backreference](../../docs/rules/no-useless-backreference.md)                         | disallow useless backreferences in regular expressions                                  | ✅  |    |    |    |    |
| [no-useless-dollar-replacements](../../docs/rules/no-useless-dollar-replacements.md)             | disallow useless `$` replacements in replacement string                                 | ✅  |    |    |    |    |
| [strict](../../docs/rules/strict.md)                                                             | disallow not strictly valid regular expressions                                         | ✅  |    | 🔧 | 💡 |    |

## Best Practices

| Name                                                                                               | Description                                                                                | 💼 | ⚠️ | 🔧 | 💡 | ❌  |
| :------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- | :- | :- | :- | :- | :- |
| [confusing-quantifier](../../docs/rules/confusing-quantifier.md)                                   | disallow confusing quantifiers                                                             |    | ✅  |    |    |    |
| [control-character-escape](../../docs/rules/control-character-escape.md)                           | enforce consistent escaping of control characters                                          | ✅  |    | 🔧 |    |    |
| [negation](../../docs/rules/negation.md)                                                           | enforce use of escapes on negation                                                         | ✅  |    | 🔧 |    |    |
| [no-dupe-characters-character-class](../../docs/rules/no-dupe-characters-character-class.md)       | disallow duplicate characters in the RegExp character class                                | ✅  |    | 🔧 |    |    |
| [no-extra-lookaround-assertions](../../docs/rules/no-extra-lookaround-assertions.md)               | disallow unnecessary nested lookaround assertions                                          |    |    | 🔧 |    |    |
| [no-invisible-character](../../docs/rules/no-invisible-character.md)                               | disallow invisible raw character                                                           | ✅  |    | 🔧 |    |    |
| [no-legacy-features](../../docs/rules/no-legacy-features.md)                                       | disallow legacy RegExp features                                                            | ✅  |    |    |    |    |
| [no-non-standard-flag](../../docs/rules/no-non-standard-flag.md)                                   | disallow non-standard flags                                                                | ✅  |    |    |    |    |
| [no-obscure-range](../../docs/rules/no-obscure-range.md)                                           | disallow obscure character ranges                                                          | ✅  |    |    |    |    |
| [no-octal](../../docs/rules/no-octal.md)                                                           | disallow octal escape sequence                                                             |    |    |    | 💡 |    |
| [no-standalone-backslash](../../docs/rules/no-standalone-backslash.md)                             | disallow standalone backslashes (`\`)                                                      |    |    |    |    |    |
| [no-trivially-nested-assertion](../../docs/rules/no-trivially-nested-assertion.md)                 | disallow trivially nested assertions                                                       | ✅  |    | 🔧 |    |    |
| [no-trivially-nested-quantifier](../../docs/rules/no-trivially-nested-quantifier.md)               | disallow nested quantifiers that can be rewritten as one quantifier                        | ✅  |    | 🔧 |    |    |
| [no-unused-capturing-group](../../docs/rules/no-unused-capturing-group.md)                         | disallow unused capturing group                                                            | ✅  |    | 🔧 | 💡 |    |
| [no-useless-character-class](../../docs/rules/no-useless-character-class.md)                       | disallow character class with one character                                                | ✅  |    | 🔧 |    |    |
| [no-useless-flag](../../docs/rules/no-useless-flag.md)                                             | disallow unnecessary regex flags                                                           |    | ✅  | 🔧 |    |    |
| [no-useless-lazy](../../docs/rules/no-useless-lazy.md)                                             | disallow unnecessarily non-greedy quantifiers                                              | ✅  |    | 🔧 |    |    |
| [no-useless-quantifier](../../docs/rules/no-useless-quantifier.md)                                 | disallow quantifiers that can be removed                                                   | ✅  |    | 🔧 | 💡 |    |
| [no-useless-range](../../docs/rules/no-useless-range.md)                                           | disallow unnecessary range of characters by using a hyphen                                 | ✅  |    | 🔧 |    |    |
| [no-useless-two-nums-quantifier](../../docs/rules/no-useless-two-nums-quantifier.md)               | disallow unnecessary `{n,m}` quantifier                                                    | ✅  |    | 🔧 |    |    |
| [no-zero-quantifier](../../docs/rules/no-zero-quantifier.md)                                       | disallow quantifiers with a maximum of zero                                                | ✅  |    |    | 💡 |    |
| [optimal-lookaround-quantifier](../../docs/rules/optimal-lookaround-quantifier.md)                 | disallow the alternatives of lookarounds that end with a non-constant quantifier           |    | ✅  |    |    |    |
| [optimal-quantifier-concatenation](../../docs/rules/optimal-quantifier-concatenation.md)           | require optimal quantifiers for concatenated quantifiers                                   | ✅  |    | 🔧 |    |    |
| [prefer-escape-replacement-dollar-char](../../docs/rules/prefer-escape-replacement-dollar-char.md) | enforces escape of replacement `$` character (`$$`).                                       |    |    |    |    |    |
| [prefer-predefined-assertion](../../docs/rules/prefer-predefined-assertion.md)                     | prefer predefined assertion over equivalent lookarounds                                    | ✅  |    | 🔧 |    |    |
| [prefer-quantifier](../../docs/rules/prefer-quantifier.md)                                         | enforce using quantifier                                                                   |    |    | 🔧 |    |    |
| [prefer-range](../../docs/rules/prefer-range.md)                                                   | enforce using character class range                                                        | ✅  |    | 🔧 |    |    |
| [prefer-regexp-exec](../../docs/rules/prefer-regexp-exec.md)                                       | enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided |    |    |    |    |    |
| [prefer-regexp-test](../../docs/rules/prefer-regexp-test.md)                                       | enforce that `RegExp#test` is used instead of `String#match` and `RegExp#exec`             |    |    | 🔧 |    |    |
| [require-unicode-regexp](../../docs/rules/require-unicode-regexp.md)                               | enforce the use of the `u` flag                                                            |    |    | 🔧 |    |    |
| [sort-alternatives](../../docs/rules/sort-alternatives.md)                                         | sort alternatives if order doesn't matter                                                  |    |    | 🔧 |    |    |
| [use-ignore-case](../../docs/rules/use-ignore-case.md)                                             | use the `i` flag if it simplifies the pattern                                              |    |    | 🔧 |    |    |

## Stylistic Issues

| Name                                                                                     | Description                                                            | 💼 | ⚠️ | 🔧 | 💡 | ❌  |
| :--------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- | :- | :- | :- | :- | :- |
| [hexadecimal-escape](../../docs/rules/hexadecimal-escape.md)                             | enforce consistent usage of hexadecimal escape                         |    |    | 🔧 |    |    |
| [letter-case](../../docs/rules/letter-case.md)                                           | enforce into your favorite case                                        |    |    | 🔧 |    |    |
| [match-any](../../docs/rules/match-any.md)                                               | enforce match any character style                                      | ✅  |    | 🔧 |    |    |
| [no-useless-escape](../../docs/rules/no-useless-escape.md)                               | disallow unnecessary escape characters in RegExp                       | ✅  |    | 🔧 |    |    |
| [no-useless-non-capturing-group](../../docs/rules/no-useless-non-capturing-group.md)     | disallow unnecessary Non-capturing group                               | ✅  |    | 🔧 |    |    |
| [prefer-character-class](../../docs/rules/prefer-character-class.md)                     | enforce using character class                                          | ✅  |    | 🔧 |    |    |
| [prefer-d](../../docs/rules/prefer-d.md)                                                 | enforce using `\d`                                                     | ✅  |    | 🔧 |    |    |
| [prefer-lookaround](../../docs/rules/prefer-lookaround.md)                               | prefer lookarounds over capturing group that do not replace            |    |    | 🔧 |    |    |
| [prefer-named-backreference](../../docs/rules/prefer-named-backreference.md)             | enforce using named backreferences                                     |    |    | 🔧 |    |    |
| [prefer-named-capture-group](../../docs/rules/prefer-named-capture-group.md)             | enforce using named capture groups                                     |    |    |    |    |    |
| [prefer-named-replacement](../../docs/rules/prefer-named-replacement.md)                 | enforce using named replacement                                        |    |    | 🔧 |    |    |
| [prefer-plus-quantifier](../../docs/rules/prefer-plus-quantifier.md)                     | enforce using `+` quantifier                                           | ✅  |    | 🔧 |    |    |
| [prefer-question-quantifier](../../docs/rules/prefer-question-quantifier.md)             | enforce using `?` quantifier                                           | ✅  |    | 🔧 |    |    |
| [prefer-result-array-groups](../../docs/rules/prefer-result-array-groups.md)             | enforce using result array `groups`                                    |    |    | 🔧 |    |    |
| [prefer-star-quantifier](../../docs/rules/prefer-star-quantifier.md)                     | enforce using `*` quantifier                                           | ✅  |    | 🔧 |    |    |
| [prefer-unicode-codepoint-escapes](../../docs/rules/prefer-unicode-codepoint-escapes.md) | enforce use of unicode codepoint escapes                               | ✅  |    | 🔧 |    |    |
| [prefer-w](../../docs/rules/prefer-w.md)                                                 | enforce using `\w`                                                     | ✅  |    | 🔧 |    |    |
| [sort-character-class-elements](../../docs/rules/sort-character-class-elements.md)       | enforces elements order in character class                             |    |    | 🔧 |    |    |
| [sort-flags](../../docs/rules/sort-flags.md)                                             | require regex flags to be sorted                                       | ✅  |    | 🔧 |    |    |
| [unicode-escape](../../docs/rules/unicode-escape.md)                                     | enforce consistent usage of unicode escape or unicode codepoint escape |    |    | 🔧 |    |    |

## Deprecated

| Name                                                                               | Description                                   | 💼 | ⚠️ | 🔧 | 💡 | ❌  |
| :--------------------------------------------------------------------------------- | :-------------------------------------------- | :- | :- | :- | :- | :- |
| [no-assertion-capturing-group](../../docs/rules/no-assertion-capturing-group.md)   | disallow capturing group that captures empty. |    |    |    |    | ❌  |
| [no-useless-exactly-quantifier](../../docs/rules/no-useless-exactly-quantifier.md) | disallow unnecessary exactly quantifier       |    |    |    |    | ❌  |
| [no-useless-non-greedy](../../docs/rules/no-useless-non-greedy.md)                 | disallow unnecessarily non-greedy quantifiers |    |    | 🔧 |    | ❌  |
| [order-in-character-class](../../docs/rules/order-in-character-class.md)           | enforces elements order in character class    |    |    | 🔧 |    | ❌  |
| [prefer-t](../../docs/rules/prefer-t.md)                                           | enforce using `\t`                            |    |    | 🔧 |    | ❌  |

<!-- end auto-generated rules list -->
