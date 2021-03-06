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

## Features

This ESLint plugin provides linting rules relate to better ways to help you avoid problems when using RegExp.

You can check on the [Online DEMO](https://ota-meshi.github.io/eslint-plugin-regexp/playground/).

<!--DOCS_IGNORE_START-->

## Documentation

See [documents](https://ota-meshi.github.io/eslint-plugin-regexp/).

## Installation

```bash
npm install --save-dev eslint eslint-plugin-regexp
```

> **Requirements**
>
> - ESLint v6.0.0 and above
> - Node.js v8.10.0 and above

<!--DOCS_IGNORE_END-->

## Usage

<!--USAGE_SECTION_START-->

Create `.eslintrc.*` file to configure rules. See also: [http://eslint.org/docs/user-guide/configuring](http://eslint.org/docs/user-guide/configuring).

Example **.eslintrc.js**:

```js
module.exports = {
  extends: [
    // add more generic rulesets here, such as:
    // 'eslint:recommended',
    'plugin:regexp/recommended'
  ],
  rules: {
    // override/add rules settings here, such as:
    // 'regexp/rule-name': 'error'
  }
}
```

## Configs

This plugin provides one config:

- `plugin:regexp/recommended` ... This is the recommended configuration for this plugin.  
  See [lib/configs/recommended.ts](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/configs/recommended.ts) for details.

<!--USAGE_SECTION_END-->

## Rules

<!--RULES_SECTION_START-->

The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) automatically fixes problems reported by rules which have a wrench :wrench: below.  
The rules with the following star :star: are included in the `plugin:regexp/recommended` config.

<!--RULES_TABLE_START-->

| Rule ID | Description |    |
|:--------|:------------|:---|
| [regexp/match-any](https://ota-meshi.github.io/eslint-plugin-regexp/rules/match-any.html) | enforce match any character style | :star::wrench: |
| [regexp/no-assertion-capturing-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-assertion-capturing-group.html) | disallow capturing group that captures assertions. | :star: |
| [regexp/no-dupe-characters-character-class](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-dupe-characters-character-class.html) | disallow duplicate characters in the RegExp character class | :star: |
| [regexp/no-empty-group](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-group.html) | disallow empty group | :star: |
| [regexp/no-empty-lookarounds-assertion](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-lookarounds-assertion.html) | disallow empty lookahead assertion or empty lookbehind assertion | :star: |
| [regexp/no-escape-backspace](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-escape-backspace.html) | disallow escape backspace (`[\b]`) | :star: |
| [regexp/no-invisible-character](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-invisible-character.html) | disallow invisible raw character | :star::wrench: |
| [regexp/no-octal](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-octal.html) | disallow octal escape sequence | :star: |
| [regexp/no-useless-backreference](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-backreference.html) | disallow useless backreferences in regular expressions |  |
| [regexp/no-useless-character-class](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-character-class.html) | disallow character class with one character | :wrench: |
| [regexp/no-useless-exactly-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-exactly-quantifier.html) | disallow unnecessary exactly quantifier | :star: |
| [regexp/no-useless-non-greedy](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-non-greedy.html) | disallow unnecessary quantifier non-greedy (`?`) | :wrench: |
| [regexp/no-useless-two-nums-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-two-nums-quantifier.html) | disallow unnecessary `{n,m}` quantifier | :star: |
| [regexp/prefer-d](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-d.html) | enforce using `\d` | :star::wrench: |
| [regexp/prefer-plus-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-plus-quantifier.html) | enforce using `+` quantifier | :star::wrench: |
| [regexp/prefer-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-quantifier.html) | enforce using quantifier | :wrench: |
| [regexp/prefer-question-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-question-quantifier.html) | enforce using `?` quantifier | :star::wrench: |
| [regexp/prefer-regexp-exec](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-regexp-exec.html) | enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided |  |
| [regexp/prefer-regexp-test](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-regexp-test.html) | enforce that `RegExp#test` is used instead of `String#match` and `RegExp#exec` | :wrench: |
| [regexp/prefer-star-quantifier](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-star-quantifier.html) | enforce using `*` quantifier | :star::wrench: |
| [regexp/prefer-t](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-t.html) | enforce using `\t` | :star::wrench: |
| [regexp/prefer-unicode-codepoint-escapes](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-unicode-codepoint-escapes.html) | enforce use of unicode codepoint escapes | :wrench: |
| [regexp/prefer-w](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-w.html) | enforce using `\w` | :star::wrench: |

<!--RULES_TABLE_END-->
<!--RULES_SECTION_END-->

<!--DOCS_IGNORE_START-->

## Contributing

Welcome contributing!

Please use GitHub's Issues/PRs.

### Development Tools

- `npm test` runs tests and measures coverage.  
- `npm run update` runs in order to update readme and recommended configuration.  

<!--DOCS_IGNORE_END-->

## License

See the [LICENSE](LICENSE) file for license rights and limitations (MIT).
