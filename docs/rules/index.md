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

| Name                                                                                                                                     | Description                                                                             | 💼 | ⚠️ | 🔧 | 💡 | ❌  |
| :--------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :- | :- | :- | :- | :- |
| [no-contradiction-with-assertion](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-contradiction-with-assertion.html)           | disallow elements that contradict assertions                                            |    |    |    | 💡 |    |
| [no-control-character](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-control-character.html)                                 | disallow control characters                                                             |    |    |    | 💡 |    |
| [no-dupe-disjunctions](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-dupe-disjunctions.html)                                 | disallow duplicate disjunctions                                                         | ✅  |    |    | 💡 |    |
| [no-empty-alternative](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-alternative.html)                                 | disallow alternatives without elements                                                  |    | ✅  |    |    |    |
| [no-empty-capturing-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-capturing-group.html)                         | disallow capturing group that captures empty.                                           | ✅  |    |    |    |    |
| [no-empty-character-class](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-character-class.html)                         | disallow character classes that match no characters                                     |    |    |    |    |    |
| [no-empty-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-group.html)                                             | disallow empty group                                                                    | ✅  |    |    |    |    |
| [no-empty-lookarounds-assertion](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-lookarounds-assertion.html)             | disallow empty lookahead assertion or empty lookbehind assertion                        | ✅  |    |    |    |    |
| [no-escape-backspace](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-escape-backspace.html)                                   | disallow escape backspace (`[\b]`)                                                      | ✅  |    |    |    |    |
| [no-invalid-regexp](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-invalid-regexp.html)                                       | disallow invalid regular expression strings in `RegExp` constructors                    | ✅  |    |    |    |    |
| [no-lazy-ends](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-lazy-ends.html)                                                 | disallow lazy quantifiers at the end of an expression                                   |    | ✅  |    |    |    |
| [no-misleading-unicode-character](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-misleading-unicode-character.html)           | disallow multi-code-point characters in character classes and quantifiers               |    |    | 🔧 | 💡 |    |
| [no-missing-g-flag](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-missing-g-flag.html)                                       | disallow missing `g` flag in patterns used in `String#matchAll` and `String#replaceAll` |    |    | 🔧 |    |    |
| [no-optional-assertion](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-optional-assertion.html)                               | disallow optional assertions                                                            | ✅  |    |    |    |    |
| [no-potentially-useless-backreference](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-potentially-useless-backreference.html) | disallow backreferences that reference a group that might not be matched                |    | ✅  |    |    |    |
| [no-super-linear-backtracking](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-super-linear-backtracking.html)                 | disallow exponential and polynomial backtracking                                        | ✅  |    | 🔧 |    |    |
| [no-super-linear-move](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-super-linear-move.html)                                 | disallow quantifiers that cause quadratic moves                                         |    |    |    |    |    |
| [no-useless-assertions](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-assertions.html)                               | disallow assertions that are known to always accept (or reject)                         | ✅  |    |    |    |    |
| [no-useless-backreference](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-backreference.html)                         | disallow useless backreferences in regular expressions                                  | ✅  |    |    |    |    |
| [no-useless-dollar-replacements](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-dollar-replacements.html)             | disallow useless `$` replacements in replacement string                                 | ✅  |    |    |    |    |
| [strict](https://ota-meshi.github.io/eslint-plugin-regexp/rules/strict.html)                                                             | disallow not strictly valid regular expressions                                         | ✅  |    | 🔧 | 💡 |    |

## Best Practices

| Name                                                                                                                                       | Description                                                                                | 💼 | ⚠️ | 🔧 | 💡 | ❌  |
| :----------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- | :- | :- | :- | :- | :- |
| [confusing-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/confusing-quantifier.html)                                   | disallow confusing quantifiers                                                             |    | ✅  |    |    |    |
| [control-character-escape](https://ota-meshi.github.io/eslint-plugin-regexp/rules/control-character-escape.html)                           | enforce consistent escaping of control characters                                          | ✅  |    | 🔧 |    |    |
| [negation](https://ota-meshi.github.io/eslint-plugin-regexp/rules/negation.html)                                                           | enforce use of escapes on negation                                                         | ✅  |    | 🔧 |    |    |
| [no-dupe-characters-character-class](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-dupe-characters-character-class.html)       | disallow duplicate characters in the RegExp character class                                | ✅  |    | 🔧 |    |    |
| [no-extra-lookaround-assertions](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-extra-lookaround-assertions.html)               | disallow unnecessary nested lookaround assertions                                          |    |    | 🔧 |    |    |
| [no-invisible-character](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-invisible-character.html)                               | disallow invisible raw character                                                           | ✅  |    | 🔧 |    |    |
| [no-legacy-features](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-legacy-features.html)                                       | disallow legacy RegExp features                                                            | ✅  |    |    |    |    |
| [no-non-standard-flag](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-non-standard-flag.html)                                   | disallow non-standard flags                                                                | ✅  |    |    |    |    |
| [no-obscure-range](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-obscure-range.html)                                           | disallow obscure character ranges                                                          | ✅  |    |    |    |    |
| [no-octal](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-octal.html)                                                           | disallow octal escape sequence                                                             |    |    |    | 💡 |    |
| [no-standalone-backslash](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-standalone-backslash.html)                             | disallow standalone backslashes (`\`)                                                      |    |    |    |    |    |
| [no-trivially-nested-assertion](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-trivially-nested-assertion.html)                 | disallow trivially nested assertions                                                       | ✅  |    | 🔧 |    |    |
| [no-trivially-nested-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-trivially-nested-quantifier.html)               | disallow nested quantifiers that can be rewritten as one quantifier                        | ✅  |    | 🔧 |    |    |
| [no-unused-capturing-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-unused-capturing-group.html)                         | disallow unused capturing group                                                            | ✅  |    | 🔧 | 💡 |    |
| [no-useless-character-class](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-character-class.html)                       | disallow character class with one character                                                | ✅  |    | 🔧 |    |    |
| [no-useless-flag](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-flag.html)                                             | disallow unnecessary regex flags                                                           |    | ✅  | 🔧 |    |    |
| [no-useless-lazy](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-lazy.html)                                             | disallow unnecessarily non-greedy quantifiers                                              | ✅  |    | 🔧 |    |    |
| [no-useless-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-quantifier.html)                                 | disallow quantifiers that can be removed                                                   | ✅  |    | 🔧 | 💡 |    |
| [no-useless-range](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-range.html)                                           | disallow unnecessary range of characters by using a hyphen                                 | ✅  |    | 🔧 |    |    |
| [no-useless-two-nums-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-two-nums-quantifier.html)               | disallow unnecessary `{n,m}` quantifier                                                    | ✅  |    | 🔧 |    |    |
| [no-zero-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-zero-quantifier.html)                                       | disallow quantifiers with a maximum of zero                                                | ✅  |    |    | 💡 |    |
| [optimal-lookaround-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/optimal-lookaround-quantifier.html)                 | disallow the alternatives of lookarounds that end with a non-constant quantifier           |    | ✅  |    |    |    |
| [optimal-quantifier-concatenation](https://ota-meshi.github.io/eslint-plugin-regexp/rules/optimal-quantifier-concatenation.html)           | require optimal quantifiers for concatenated quantifiers                                   | ✅  |    | 🔧 |    |    |
| [prefer-escape-replacement-dollar-char](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-escape-replacement-dollar-char.html) | enforces escape of replacement `$` character (`$$`).                                       |    |    |    |    |    |
| [prefer-predefined-assertion](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-predefined-assertion.html)                     | prefer predefined assertion over equivalent lookarounds                                    | ✅  |    | 🔧 |    |    |
| [prefer-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-quantifier.html)                                         | enforce using quantifier                                                                   |    |    | 🔧 |    |    |
| [prefer-range](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-range.html)                                                   | enforce using character class range                                                        | ✅  |    | 🔧 |    |    |
| [prefer-regexp-exec](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-regexp-exec.html)                                       | enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided |    |    |    |    |    |
| [prefer-regexp-test](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-regexp-test.html)                                       | enforce that `RegExp#test` is used instead of `String#match` and `RegExp#exec`             |    |    | 🔧 |    |    |
| [require-unicode-regexp](https://ota-meshi.github.io/eslint-plugin-regexp/rules/require-unicode-regexp.html)                               | enforce the use of the `u` flag                                                            |    |    | 🔧 |    |    |
| [sort-alternatives](https://ota-meshi.github.io/eslint-plugin-regexp/rules/sort-alternatives.html)                                         | sort alternatives if order doesn't matter                                                  |    |    | 🔧 |    |    |
| [use-ignore-case](https://ota-meshi.github.io/eslint-plugin-regexp/rules/use-ignore-case.html)                                             | use the `i` flag if it simplifies the pattern                                              |    |    | 🔧 |    |    |

## Stylistic Issues

| Name                                                                                                                             | Description                                                            | 💼 | ⚠️ | 🔧 | 💡 | ❌  |
| :------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- | :- | :- | :- | :- | :- |
| [hexadecimal-escape](https://ota-meshi.github.io/eslint-plugin-regexp/rules/hexadecimal-escape.html)                             | enforce consistent usage of hexadecimal escape                         |    |    | 🔧 |    |    |
| [letter-case](https://ota-meshi.github.io/eslint-plugin-regexp/rules/letter-case.html)                                           | enforce into your favorite case                                        |    |    | 🔧 |    |    |
| [match-any](https://ota-meshi.github.io/eslint-plugin-regexp/rules/match-any.html)                                               | enforce match any character style                                      | ✅  |    | 🔧 |    |    |
| [no-useless-escape](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-escape.html)                               | disallow unnecessary escape characters in RegExp                       | ✅  |    | 🔧 |    |    |
| [no-useless-non-capturing-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-non-capturing-group.html)     | disallow unnecessary Non-capturing group                               | ✅  |    | 🔧 |    |    |
| [prefer-character-class](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-character-class.html)                     | enforce using character class                                          | ✅  |    | 🔧 |    |    |
| [prefer-d](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-d.html)                                                 | enforce using `\d`                                                     | ✅  |    | 🔧 |    |    |
| [prefer-lookaround](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-lookaround.html)                               | prefer lookarounds over capturing group that do not replace            |    |    | 🔧 |    |    |
| [prefer-named-backreference](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-named-backreference.html)             | enforce using named backreferences                                     |    |    | 🔧 |    |    |
| [prefer-named-capture-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-named-capture-group.html)             | enforce using named capture groups                                     |    |    |    |    |    |
| [prefer-named-replacement](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-named-replacement.html)                 | enforce using named replacement                                        |    |    | 🔧 |    |    |
| [prefer-plus-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-plus-quantifier.html)                     | enforce using `+` quantifier                                           | ✅  |    | 🔧 |    |    |
| [prefer-question-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-question-quantifier.html)             | enforce using `?` quantifier                                           | ✅  |    | 🔧 |    |    |
| [prefer-result-array-groups](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-result-array-groups.html)             | enforce using result array `groups`                                    |    |    | 🔧 |    |    |
| [prefer-star-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-star-quantifier.html)                     | enforce using `*` quantifier                                           | ✅  |    | 🔧 |    |    |
| [prefer-unicode-codepoint-escapes](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-unicode-codepoint-escapes.html) | enforce use of unicode codepoint escapes                               | ✅  |    | 🔧 |    |    |
| [prefer-w](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-w.html)                                                 | enforce using `\w`                                                     | ✅  |    | 🔧 |    |    |
| [sort-character-class-elements](https://ota-meshi.github.io/eslint-plugin-regexp/rules/sort-character-class-elements.html)       | enforces elements order in character class                             |    |    | 🔧 |    |    |
| [sort-flags](https://ota-meshi.github.io/eslint-plugin-regexp/rules/sort-flags.html)                                             | require regex flags to be sorted                                       | ✅  |    | 🔧 |    |    |
| [unicode-escape](https://ota-meshi.github.io/eslint-plugin-regexp/rules/unicode-escape.html)                                     | enforce consistent usage of unicode escape or unicode codepoint escape |    |    | 🔧 |    |    |

## Deprecated

| Name                                                                                                                       | Description                                   | 💼 | ⚠️ | 🔧 | 💡 | ❌  |
| :------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------- | :- | :- | :- | :- | :- |
| [no-assertion-capturing-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-assertion-capturing-group.html)   | disallow capturing group that captures empty. |    |    |    |    | ❌  |
| [no-useless-exactly-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-exactly-quantifier.html) | disallow unnecessary exactly quantifier       |    |    |    |    | ❌  |
| [no-useless-non-greedy](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-non-greedy.html)                 | disallow unnecessarily non-greedy quantifiers |    |    | 🔧 |    | ❌  |
| [order-in-character-class](https://ota-meshi.github.io/eslint-plugin-regexp/rules/order-in-character-class.html)           | enforces elements order in character class    |    |    | 🔧 |    | ❌  |
| [prefer-t](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-t.html)                                           | enforce using `\t`                            |    |    | 🔧 |    | ❌  |

<!-- end auto-generated rules list -->
