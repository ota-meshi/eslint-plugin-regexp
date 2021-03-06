---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-character-class"
description: "enforce using character class"
---
# regexp/prefer-character-class

> enforce using character class

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
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

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-character-class.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-character-class.ts)
