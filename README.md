# Introduction

[eslint-plugin-regexp](https://www.npmjs.com/package/eslint-plugin-regexp) is ESLint plugin for finding RegExp mistakes and RegExp style guide violations.

[![NPM license](https://img.shields.io/npm/l/eslint-plugin-regexp.svg)](https://www.npmjs.com/package/eslint-plugin-regexp)
[![NPM version](https://img.shields.io/npm/v/eslint-plugin-regexp.svg)](https://www.npmjs.com/package/eslint-plugin-regexp)
[![NPM downloads](https://img.shields.io/badge/dynamic/json.svg?label=downloads&colorB=green&suffix=/day&query=$.downloads&uri=https://api.npmjs.org//downloads/point/last-day/eslint-plugin-regexp&maxAge=3600)](http://www.npmtrends.com/eslint-plugin-regexp)
[![NPM downloads](https://img.shields.io/npm/dw/eslint-plugin-regexp.svg)](http://www.npmtrends.com/eslint-plugin-regexp)
[![NPM downloads](https://img.shields.io/npm/dm/eslint-plugin-regexp.svg)](http://www.npmtrends.com/eslint-plugin-regexp)
[![NPM downloads](https://img.shields.io/npm/dy/eslint-plugin-regexp.svg)](http://www.npmtrends.com/eslint-plugin-regexp)
[![NPM downloads](https://img.shields.io/npm/dt/eslint-plugin-regexp.svg)](http://www.npmtrends.com/eslint-plugin-regexp)
[![Build Status](https://github.com/ota-meshi/eslint-plugin-regexp/workflows/CI/badge.svg?branch=master)](https://github.com/ota-meshi/eslint-plugin-regexp/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/ota-meshi/eslint-plugin-regexp/badge.svg?branch=master)](https://coveralls.io/github/ota-meshi/eslint-plugin-regexp?branch=master)

## :name_badge: Features

This ESLint plugin provides linting rules relate to better ways to help you avoid problems when using RegExp.

- Find the wrong usage of regular expressions, and their hints.
- Enforces a consistent style of regular expressions.
- Find hints for writing optimized regular expressions.

You can check on the [Online DEMO](https://ota-meshi.github.io/eslint-plugin-regexp/playground/).

<!--DOCS_IGNORE_START-->

## :book: Documentation

See [documents](https://ota-meshi.github.io/eslint-plugin-regexp/).

## :cd: Installation

```bash
npm install --save-dev eslint eslint-plugin-regexp
```

> **Requirements**
>
> - ESLint v6.0.0 and above
> - Node.js v12.x, v14.x and above

<!--DOCS_IGNORE_END-->

## :book: Usage

<!--USAGE_SECTION_START-->

Add `regexp` to the plugins section of your `.eslintrc` configuration file (you can omit the `eslint-plugin-` prefix)
and either use one of the two configurations available (`recommended` or `all`) or configure the rules you want:

### The recommended configuration

The `plugin:regexp/recommended` config enables a subset of [the rules](#white_check_mark-rules) that should be most useful to most users.
*See [lib/configs/recommended.ts](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/configs/recommended.ts) for more details.*

```js
// .eslintrc.js
module.exports = {
    "plugins": [
        "regexp"
    ],
    "extends": [
         // add more generic rulesets here, such as:
         // 'eslint:recommended',
        "plugin:regexp/recommended"
    ]
}
```

### Advanced Configuration

Override/add specific rules configurations. *See also: [http://eslint.org/docs/user-guide/configuring](http://eslint.org/docs/user-guide/configuring)*.

```js
// .eslintrc.js
module.exports = {
    "plugins": [
        "regexp"
    ],
    "rules": {
        // Override/add rules settings here, such as:
        "regexp/rule-name": "error"
    }
}
```

### Using `"plugin:regexp/all"`

The `plugin:regexp/all` config enables all rules. It's meant for testing, not for production use because it changes with every minor and major version of the plugin. Use it at your own risk.
*See [lib/configs/all.ts](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/configs/all.ts) for more details.*

<!--USAGE_SECTION_END-->

## :white_check_mark: Rules

<!--RULES_SECTION_START-->

The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) automatically fixes problems reported by rules which have a wrench :wrench: below.
The rules with the following star :star: are included in the `plugin:regexp/recommended` config.

<!--RULES_TABLE_START-->

### Possible Errors

| Rule ID | Description |    |
|:--------|:------------|:---|
| [regexp/no-contradiction-with-assertion](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-contradiction-with-assertion.html) | disallow elements that contradict assertions |  |
| [regexp/no-control-character](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-control-character.html) | disallow control characters |  |
| [regexp/no-dupe-disjunctions](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-dupe-disjunctions.html) | disallow duplicate disjunctions | :star: |
| [regexp/no-empty-alternative](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-alternative.html) | disallow alternatives without elements | :star: |
| [regexp/no-empty-capturing-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-capturing-group.html) | disallow capturing group that captures empty. | :star: |
| [regexp/no-empty-character-class](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-character-class.html) | disallow character classes that match no characters |  |
| [regexp/no-empty-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-group.html) | disallow empty group | :star: |
| [regexp/no-empty-lookarounds-assertion](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-lookarounds-assertion.html) | disallow empty lookahead assertion or empty lookbehind assertion | :star: |
| [regexp/no-escape-backspace](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-escape-backspace.html) | disallow escape backspace (`[\b]`) | :star: |
| [regexp/no-invalid-regexp](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-invalid-regexp.html) | disallow invalid regular expression strings in `RegExp` constructors | :star: |
| [regexp/no-lazy-ends](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-lazy-ends.html) | disallow lazy quantifiers at the end of an expression | :star: |
| [regexp/no-misleading-unicode-character](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-misleading-unicode-character.html) | disallow multi-code-point characters in character classes and quantifiers | :wrench: |
| [regexp/no-optional-assertion](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-optional-assertion.html) | disallow optional assertions | :star: |
| [regexp/no-potentially-useless-backreference](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-potentially-useless-backreference.html) | disallow backreferences that reference a group that might not be matched | :star: |
| [regexp/no-super-linear-backtracking](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-super-linear-backtracking.html) | disallow exponential and polynomial backtracking | :star::wrench: |
| [regexp/no-super-linear-move](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-super-linear-move.html) | disallow quantifiers that cause quadratic moves |  |
| [regexp/no-useless-assertions](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-assertions.html) | disallow assertions that are known to always accept (or reject) | :star: |
| [regexp/no-useless-backreference](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-backreference.html) | disallow useless backreferences in regular expressions | :star: |
| [regexp/no-useless-dollar-replacements](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-dollar-replacements.html) | disallow useless `$` replacements in replacement string | :star: |
| [regexp/strict](https://ota-meshi.github.io/eslint-plugin-regexp/rules/strict.html) | disallow not strictly valid regular expressions | :star::wrench: |

### Best Practices

| Rule ID | Description |    |
|:--------|:------------|:---|
| [regexp/confusing-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/confusing-quantifier.html) | disallow confusing quantifiers | :star: |
| [regexp/control-character-escape](https://ota-meshi.github.io/eslint-plugin-regexp/rules/control-character-escape.html) | enforce consistent escaping of control characters | :star::wrench: |
| [regexp/negation](https://ota-meshi.github.io/eslint-plugin-regexp/rules/negation.html) | enforce use of escapes on negation | :star::wrench: |
| [regexp/no-dupe-characters-character-class](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-dupe-characters-character-class.html) | disallow duplicate characters in the RegExp character class | :star::wrench: |
| [regexp/no-invisible-character](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-invisible-character.html) | disallow invisible raw character | :star::wrench: |
| [regexp/no-legacy-features](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-legacy-features.html) | disallow legacy RegExp features | :star: |
| [regexp/no-non-standard-flag](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-non-standard-flag.html) | disallow non-standard flags | :star: |
| [regexp/no-obscure-range](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-obscure-range.html) | disallow obscure character ranges | :star: |
| [regexp/no-octal](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-octal.html) | disallow octal escape sequence |  |
| [regexp/no-standalone-backslash](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-standalone-backslash.html) | disallow standalone backslashes (`\`) |  |
| [regexp/no-trivially-nested-assertion](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-trivially-nested-assertion.html) | disallow trivially nested assertions | :star::wrench: |
| [regexp/no-trivially-nested-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-trivially-nested-quantifier.html) | disallow nested quantifiers that can be rewritten as one quantifier | :star::wrench: |
| [regexp/no-unused-capturing-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-unused-capturing-group.html) | disallow unused capturing group | :star::wrench: |
| [regexp/no-useless-character-class](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-character-class.html) | disallow character class with one character | :star::wrench: |
| [regexp/no-useless-flag](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-flag.html) | disallow unnecessary regex flags | :star::wrench: |
| [regexp/no-useless-lazy](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-lazy.html) | disallow unnecessarily non-greedy quantifiers | :star::wrench: |
| [regexp/no-useless-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-quantifier.html) | disallow quantifiers that can be removed | :star::wrench: |
| [regexp/no-useless-range](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-range.html) | disallow unnecessary range of characters by using a hyphen | :star::wrench: |
| [regexp/no-useless-two-nums-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-two-nums-quantifier.html) | disallow unnecessary `{n,m}` quantifier | :star::wrench: |
| [regexp/no-zero-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-zero-quantifier.html) | disallow quantifiers with a maximum of zero | :star: |
| [regexp/optimal-lookaround-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/optimal-lookaround-quantifier.html) | disallow the alternatives of lookarounds that end with a non-constant quantifier | :star: |
| [regexp/optimal-quantifier-concatenation](https://ota-meshi.github.io/eslint-plugin-regexp/rules/optimal-quantifier-concatenation.html) | require optimal quantifiers for concatenated quantifiers | :star::wrench: |
| [regexp/prefer-escape-replacement-dollar-char](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-escape-replacement-dollar-char.html) | enforces escape of replacement `$` character (`$$`). |  |
| [regexp/prefer-predefined-assertion](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-predefined-assertion.html) | prefer predefined assertion over equivalent lookarounds | :star::wrench: |
| [regexp/prefer-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-quantifier.html) | enforce using quantifier | :wrench: |
| [regexp/prefer-range](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-range.html) | enforce using character class range | :star::wrench: |
| [regexp/prefer-regexp-exec](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-regexp-exec.html) | enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided |  |
| [regexp/prefer-regexp-test](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-regexp-test.html) | enforce that `RegExp#test` is used instead of `String#match` and `RegExp#exec` | :wrench: |
| [regexp/require-unicode-regexp](https://ota-meshi.github.io/eslint-plugin-regexp/rules/require-unicode-regexp.html) | enforce the use of the `u` flag | :wrench: |
| [regexp/sort-alternatives](https://ota-meshi.github.io/eslint-plugin-regexp/rules/sort-alternatives.html) | sort alternatives if order doesn't matter | :wrench: |
| [regexp/use-ignore-case](https://ota-meshi.github.io/eslint-plugin-regexp/rules/use-ignore-case.html) | use the `i` flag if it simplifies the pattern | :wrench: |

### Stylistic Issues

| Rule ID | Description |    |
|:--------|:------------|:---|
| [regexp/hexadecimal-escape](https://ota-meshi.github.io/eslint-plugin-regexp/rules/hexadecimal-escape.html) | enforce consistent usage of hexadecimal escape | :wrench: |
| [regexp/letter-case](https://ota-meshi.github.io/eslint-plugin-regexp/rules/letter-case.html) | enforce into your favorite case | :wrench: |
| [regexp/match-any](https://ota-meshi.github.io/eslint-plugin-regexp/rules/match-any.html) | enforce match any character style | :star::wrench: |
| [regexp/no-useless-escape](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-escape.html) | disallow unnecessary escape characters in RegExp | :star::wrench: |
| [regexp/no-useless-non-capturing-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-non-capturing-group.html) | disallow unnecessary Non-capturing group | :star::wrench: |
| [regexp/prefer-character-class](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-character-class.html) | enforce using character class | :star::wrench: |
| [regexp/prefer-d](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-d.html) | enforce using `\d` | :star::wrench: |
| [regexp/prefer-lookaround](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-lookaround.html) | prefer lookarounds over capturing group that do not replace | :wrench: |
| [regexp/prefer-named-backreference](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-named-backreference.html) | enforce using named backreferences | :wrench: |
| [regexp/prefer-named-capture-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-named-capture-group.html) | enforce using named capture groups |  |
| [regexp/prefer-named-replacement](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-named-replacement.html) | enforce using named replacement | :wrench: |
| [regexp/prefer-plus-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-plus-quantifier.html) | enforce using `+` quantifier | :star::wrench: |
| [regexp/prefer-question-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-question-quantifier.html) | enforce using `?` quantifier | :star::wrench: |
| [regexp/prefer-result-array-groups](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-result-array-groups.html) | enforce using result array `groups` | :wrench: |
| [regexp/prefer-star-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-star-quantifier.html) | enforce using `*` quantifier | :star::wrench: |
| [regexp/prefer-unicode-codepoint-escapes](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-unicode-codepoint-escapes.html) | enforce use of unicode codepoint escapes | :star::wrench: |
| [regexp/prefer-w](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-w.html) | enforce using `\w` | :star::wrench: |
| [regexp/sort-character-class-elements](https://ota-meshi.github.io/eslint-plugin-regexp/rules/sort-character-class-elements.html) | enforces elements order in character class | :wrench: |
| [regexp/sort-flags](https://ota-meshi.github.io/eslint-plugin-regexp/rules/sort-flags.html) | require regex flags to be sorted | :star::wrench: |
| [regexp/unicode-escape](https://ota-meshi.github.io/eslint-plugin-regexp/rules/unicode-escape.html) | enforce consistent usage of unicode escape or unicode codepoint escape | :wrench: |

### Deprecated

- :warning: We're going to remove deprecated rules in the next major release. Please migrate to successor/new rules.
- :innocent: We don't fix bugs which are in deprecated rules since we don't have enough resources.

| Rule ID | Replaced by |
|:--------|:------------|
| [regexp/no-assertion-capturing-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-assertion-capturing-group.html) | [regexp/no-empty-capturing-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-capturing-group.html) |
| [regexp/no-useless-exactly-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-exactly-quantifier.html) | [regexp/no-useless-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-quantifier.html), [regexp/no-zero-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-zero-quantifier.html) |
| [regexp/no-useless-non-greedy](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-non-greedy.html) | [regexp/no-useless-lazy](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-lazy.html) |
| [regexp/order-in-character-class](https://ota-meshi.github.io/eslint-plugin-regexp/rules/order-in-character-class.html) | [regexp/sort-character-class-elements](https://ota-meshi.github.io/eslint-plugin-regexp/rules/sort-character-class-elements.html) |
| [regexp/prefer-t](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-t.html) | [regexp/control-character-escape](https://ota-meshi.github.io/eslint-plugin-regexp/rules/control-character-escape.html) |

<!--RULES_TABLE_END-->
<!--RULES_SECTION_END-->

## :gear: Settings

See [Settings](https://ota-meshi.github.io/eslint-plugin-regexp/settings/).

<!--DOCS_IGNORE_START-->

## :traffic_light: Semantic Versioning Policy

**eslint-plugin-regexp** follows [Semantic Versioning](http://semver.org/) and [ESLint's Semantic Versioning Policy](https://github.com/eslint/eslint#semantic-versioning-policy).

## :beers: Contributing

Welcome contributing!

Please use GitHub's Issues/PRs.

See [CONTRIBUTING.md](CONTRIBUTING.md).

### Development Tools

- `npm test` runs tests and measures coverage.
- `npm run update` runs in order to update readme and recommended configuration.
- `npm run new [new rule name]` runs to create the files needed for the new rule.
- `npm run docs:watch` starts the website locally.

<!--DOCS_IGNORE_END-->

## :lock: License

See the [LICENSE](LICENSE) file for license rights and limitations (MIT).
