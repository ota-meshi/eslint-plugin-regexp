---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-character-class"
description: "enforce using character class"
since: "v0.4.0"
---
# regexp/prefer-character-class

> enforce using character class

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule is aimed to use character classes instead of the disjunction of single element alternatives.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-character-class: "error" */

/* ✓ GOOD */
var foo = /[abc]/

/* ✗ BAD */
var foo = /a|b|c/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-character-class.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-character-class.ts)
