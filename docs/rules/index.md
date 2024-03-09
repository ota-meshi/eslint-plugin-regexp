---
sidebarDepth: 0
---

# Available Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
⚠️ Configurations set to warn in.\
🟢 Set in the `flat/recommended` configuration.\
🔵 Set in the `recommended` configuration.\
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

## Possible Errors

| Name                                                                            | Description                                                                             | 💼    | ⚠️    | 🔧 | 💡 |
| :------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------- | :---- | :---- | :- | :- |
| [no-contradiction-with-assertion](no-contradiction-with-assertion.md)           | disallow elements that contradict assertions                                            | 🟢 🔵 |       |    | 💡 |
| [no-control-character](no-control-character.md)                                 | disallow control characters                                                             |       |       |    | 💡 |
| [no-dupe-disjunctions](no-dupe-disjunctions.md)                                 | disallow duplicate disjunctions                                                         | 🟢 🔵 |       |    | 💡 |
| [no-empty-alternative](no-empty-alternative.md)                                 | disallow alternatives without elements                                                  |       | 🟢 🔵 |    | 💡 |
| [no-empty-capturing-group](no-empty-capturing-group.md)                         | disallow capturing group that captures empty.                                           | 🟢 🔵 |       |    |    |
| [no-empty-character-class](no-empty-character-class.md)                         | disallow character classes that match no characters                                     | 🟢 🔵 |       |    |    |
| [no-empty-group](no-empty-group.md)                                             | disallow empty group                                                                    | 🟢 🔵 |       |    |    |
| [no-empty-lookarounds-assertion](no-empty-lookarounds-assertion.md)             | disallow empty lookahead assertion or empty lookbehind assertion                        | 🟢 🔵 |       |    |    |
| [no-escape-backspace](no-escape-backspace.md)                                   | disallow escape backspace (`[\b]`)                                                      | 🟢 🔵 |       |    | 💡 |
| [no-invalid-regexp](no-invalid-regexp.md)                                       | disallow invalid regular expression strings in `RegExp` constructors                    | 🟢 🔵 |       |    |    |
| [no-lazy-ends](no-lazy-ends.md)                                                 | disallow lazy quantifiers at the end of an expression                                   |       | 🟢 🔵 |    | 💡 |
| [no-misleading-capturing-group](no-misleading-capturing-group.md)               | disallow capturing groups that do not behave as one would expect                        | 🟢 🔵 |       |    | 💡 |
| [no-misleading-unicode-character](no-misleading-unicode-character.md)           | disallow multi-code-point characters in character classes and quantifiers               | 🟢 🔵 |       | 🔧 | 💡 |
| [no-missing-g-flag](no-missing-g-flag.md)                                       | disallow missing `g` flag in patterns used in `String#matchAll` and `String#replaceAll` | 🟢 🔵 |       | 🔧 |    |
| [no-optional-assertion](no-optional-assertion.md)                               | disallow optional assertions                                                            | 🟢 🔵 |       |    |    |
| [no-potentially-useless-backreference](no-potentially-useless-backreference.md) | disallow backreferences that reference a group that might not be matched                |       | 🟢 🔵 |    |    |
| [no-super-linear-backtracking](no-super-linear-backtracking.md)                 | disallow exponential and polynomial backtracking                                        | 🟢 🔵 |       | 🔧 |    |
| [no-super-linear-move](no-super-linear-move.md)                                 | disallow quantifiers that cause quadratic moves                                         |       |       |    |    |
| [no-useless-assertions](no-useless-assertions.md)                               | disallow assertions that are known to always accept (or reject)                         | 🟢 🔵 |       |    | 💡 |
| [no-useless-backreference](no-useless-backreference.md)                         | disallow useless backreferences in regular expressions                                  | 🟢 🔵 |       |    |    |
| [no-useless-dollar-replacements](no-useless-dollar-replacements.md)             | disallow useless `$` replacements in replacement string                                 | 🟢 🔵 |       |    |    |
| [strict](strict.md)                                                             | disallow not strictly valid regular expressions                                         | 🟢 🔵 |       | 🔧 | 💡 |

## Best Practices

| Name                                                                              | Description                                                                                | 💼    | ⚠️    | 🔧 | 💡 |
| :-------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- | :---- | :---- | :- | :- |
| [confusing-quantifier](confusing-quantifier.md)                                   | disallow confusing quantifiers                                                             |       | 🟢 🔵 |    |    |
| [control-character-escape](control-character-escape.md)                           | enforce consistent escaping of control characters                                          | 🟢 🔵 |       | 🔧 |    |
| [negation](negation.md)                                                           | enforce use of escapes on negation                                                         | 🟢 🔵 |       | 🔧 |    |
| [no-dupe-characters-character-class](no-dupe-characters-character-class.md)       | disallow duplicate characters in the RegExp character class                                | 🟢 🔵 |       | 🔧 |    |
| [no-empty-string-literal](no-empty-string-literal.md)                             | disallow empty string literals in character classes                                        | 🟢 🔵 |       |    |    |
| [no-extra-lookaround-assertions](no-extra-lookaround-assertions.md)               | disallow unnecessary nested lookaround assertions                                          | 🟢 🔵 |       | 🔧 |    |
| [no-invisible-character](no-invisible-character.md)                               | disallow invisible raw character                                                           | 🟢 🔵 |       | 🔧 |    |
| [no-legacy-features](no-legacy-features.md)                                       | disallow legacy RegExp features                                                            | 🟢 🔵 |       |    |    |
| [no-non-standard-flag](no-non-standard-flag.md)                                   | disallow non-standard flags                                                                | 🟢 🔵 |       |    |    |
| [no-obscure-range](no-obscure-range.md)                                           | disallow obscure character ranges                                                          | 🟢 🔵 |       |    |    |
| [no-octal](no-octal.md)                                                           | disallow octal escape sequence                                                             |       |       |    | 💡 |
| [no-standalone-backslash](no-standalone-backslash.md)                             | disallow standalone backslashes (`\`)                                                      |       |       |    |    |
| [no-trivially-nested-assertion](no-trivially-nested-assertion.md)                 | disallow trivially nested assertions                                                       | 🟢 🔵 |       | 🔧 |    |
| [no-trivially-nested-quantifier](no-trivially-nested-quantifier.md)               | disallow nested quantifiers that can be rewritten as one quantifier                        | 🟢 🔵 |       | 🔧 |    |
| [no-unused-capturing-group](no-unused-capturing-group.md)                         | disallow unused capturing group                                                            | 🟢 🔵 |       | 🔧 | 💡 |
| [no-useless-character-class](no-useless-character-class.md)                       | disallow character class with one character                                                | 🟢 🔵 |       | 🔧 |    |
| [no-useless-flag](no-useless-flag.md)                                             | disallow unnecessary regex flags                                                           |       | 🟢 🔵 | 🔧 |    |
| [no-useless-lazy](no-useless-lazy.md)                                             | disallow unnecessarily non-greedy quantifiers                                              | 🟢 🔵 |       | 🔧 |    |
| [no-useless-quantifier](no-useless-quantifier.md)                                 | disallow quantifiers that can be removed                                                   | 🟢 🔵 |       | 🔧 | 💡 |
| [no-useless-range](no-useless-range.md)                                           | disallow unnecessary character ranges                                                      | 🟢 🔵 |       | 🔧 |    |
| [no-useless-set-operand](no-useless-set-operand.md)                               | disallow unnecessary elements in expression character classes                              | 🟢 🔵 |       | 🔧 |    |
| [no-useless-string-literal](no-useless-string-literal.md)                         | disallow string disjunction of single characters in `\q{...}`                              | 🟢 🔵 |       | 🔧 |    |
| [no-useless-two-nums-quantifier](no-useless-two-nums-quantifier.md)               | disallow unnecessary `{n,m}` quantifier                                                    | 🟢 🔵 |       | 🔧 |    |
| [no-zero-quantifier](no-zero-quantifier.md)                                       | disallow quantifiers with a maximum of zero                                                | 🟢 🔵 |       |    | 💡 |
| [optimal-lookaround-quantifier](optimal-lookaround-quantifier.md)                 | disallow the alternatives of lookarounds that end with a non-constant quantifier           |       | 🟢 🔵 |    | 💡 |
| [optimal-quantifier-concatenation](optimal-quantifier-concatenation.md)           | require optimal quantifiers for concatenated quantifiers                                   | 🟢 🔵 |       | 🔧 |    |
| [prefer-escape-replacement-dollar-char](prefer-escape-replacement-dollar-char.md) | enforces escape of replacement `$` character (`$$`).                                       |       |       |    |    |
| [prefer-predefined-assertion](prefer-predefined-assertion.md)                     | prefer predefined assertion over equivalent lookarounds                                    | 🟢 🔵 |       | 🔧 |    |
| [prefer-quantifier](prefer-quantifier.md)                                         | enforce using quantifier                                                                   |       |       | 🔧 |    |
| [prefer-range](prefer-range.md)                                                   | enforce using character class range                                                        | 🟢 🔵 |       | 🔧 |    |
| [prefer-regexp-exec](prefer-regexp-exec.md)                                       | enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided |       |       |    |    |
| [prefer-regexp-test](prefer-regexp-test.md)                                       | enforce that `RegExp#test` is used instead of `String#match` and `RegExp#exec`             |       |       | 🔧 |    |
| [prefer-set-operation](prefer-set-operation.md)                                   | prefer character class set operations instead of lookarounds                               | 🟢 🔵 |       | 🔧 |    |
| [require-unicode-regexp](require-unicode-regexp.md)                               | enforce the use of the `u` flag                                                            |       |       | 🔧 |    |
| [require-unicode-sets-regexp](require-unicode-sets-regexp.md)                     | enforce the use of the `v` flag                                                            |       |       | 🔧 |    |
| [simplify-set-operations](simplify-set-operations.md)                             | require simplify set operations                                                            | 🟢 🔵 |       | 🔧 |    |
| [sort-alternatives](sort-alternatives.md)                                         | sort alternatives if order doesn't matter                                                  |       |       | 🔧 |    |
| [use-ignore-case](use-ignore-case.md)                                             | use the `i` flag if it simplifies the pattern                                              | 🟢 🔵 |       | 🔧 |    |

## Stylistic Issues

| Name                                                                    | Description                                                            | 💼    | ⚠️ | 🔧 | 💡 |
| :---------------------------------------------------------------------- | :--------------------------------------------------------------------- | :---- | :- | :- | :- |
| [grapheme-string-literal](grapheme-string-literal.md)                   | enforce single grapheme in string literal                              |       |    |    |    |
| [hexadecimal-escape](hexadecimal-escape.md)                             | enforce consistent usage of hexadecimal escape                         |       |    | 🔧 |    |
| [letter-case](letter-case.md)                                           | enforce into your favorite case                                        |       |    | 🔧 |    |
| [match-any](match-any.md)                                               | enforce match any character style                                      | 🟢 🔵 |    | 🔧 |    |
| [no-useless-escape](no-useless-escape.md)                               | disallow unnecessary escape characters in RegExp                       | 🟢 🔵 |    | 🔧 |    |
| [no-useless-non-capturing-group](no-useless-non-capturing-group.md)     | disallow unnecessary non-capturing group                               | 🟢 🔵 |    | 🔧 |    |
| [prefer-character-class](prefer-character-class.md)                     | enforce using character class                                          | 🟢 🔵 |    | 🔧 |    |
| [prefer-d](prefer-d.md)                                                 | enforce using `\d`                                                     | 🟢 🔵 |    | 🔧 |    |
| [prefer-lookaround](prefer-lookaround.md)                               | prefer lookarounds over capturing group that do not replace            |       |    | 🔧 |    |
| [prefer-named-backreference](prefer-named-backreference.md)             | enforce using named backreferences                                     |       |    | 🔧 |    |
| [prefer-named-capture-group](prefer-named-capture-group.md)             | enforce using named capture groups                                     |       |    |    |    |
| [prefer-named-replacement](prefer-named-replacement.md)                 | enforce using named replacement                                        |       |    | 🔧 |    |
| [prefer-plus-quantifier](prefer-plus-quantifier.md)                     | enforce using `+` quantifier                                           | 🟢 🔵 |    | 🔧 |    |
| [prefer-question-quantifier](prefer-question-quantifier.md)             | enforce using `?` quantifier                                           | 🟢 🔵 |    | 🔧 |    |
| [prefer-result-array-groups](prefer-result-array-groups.md)             | enforce using result array `groups`                                    |       |    | 🔧 |    |
| [prefer-star-quantifier](prefer-star-quantifier.md)                     | enforce using `*` quantifier                                           | 🟢 🔵 |    | 🔧 |    |
| [prefer-unicode-codepoint-escapes](prefer-unicode-codepoint-escapes.md) | enforce use of unicode codepoint escapes                               | 🟢 🔵 |    | 🔧 |    |
| [prefer-w](prefer-w.md)                                                 | enforce using `\w`                                                     | 🟢 🔵 |    | 🔧 |    |
| [sort-character-class-elements](sort-character-class-elements.md)       | enforces elements order in character class                             |       |    | 🔧 |    |
| [sort-flags](sort-flags.md)                                             | require regex flags to be sorted                                       | 🟢 🔵 |    | 🔧 |    |
| [unicode-escape](unicode-escape.md)                                     | enforce consistent usage of unicode escape or unicode codepoint escape |       |    | 🔧 |    |

<!-- end auto-generated rules list -->

<!--REMOVED_RULES_START-->

## Removed

- :no_entry: These rules have been removed in a previous major release, after they have been deprecated for a while.

| Rule ID | Replaced by | Removed in version |
|:--------|:------------|:-------------------|
| [no-assertion-capturing-group](https://github.com/ota-meshi/eslint-plugin-regexp/blob/v1.15.0/docs/rules/no-assertion-capturing-group.md) | [regexp/no-empty-capturing-group](./no-empty-capturing-group.md) | v2.0.0 |
| [no-useless-exactly-quantifier](https://github.com/ota-meshi/eslint-plugin-regexp/blob/v1.15.0/docs/rules/no-useless-exactly-quantifier.md) | [regexp/no-useless-quantifier](./no-useless-quantifier.md), [regexp/no-zero-quantifier](./no-zero-quantifier.md) | v2.0.0 |
| [no-useless-non-greedy](https://github.com/ota-meshi/eslint-plugin-regexp/blob/v1.15.0/docs/rules/no-useless-non-greedy.md) | [regexp/no-useless-lazy](./no-useless-lazy.md) | v2.0.0 |
| [order-in-character-class](https://github.com/ota-meshi/eslint-plugin-regexp/blob/v1.15.0/docs/rules/order-in-character-class.md) | [regexp/sort-character-class-elements](./sort-character-class-elements.md) | v2.0.0 |
| [prefer-t](https://github.com/ota-meshi/eslint-plugin-regexp/blob/v1.15.0/docs/rules/prefer-t.md) | [regexp/control-character-escape](./control-character-escape.md) | v2.0.0 |

<!--REMOVED_RULES_END-->
