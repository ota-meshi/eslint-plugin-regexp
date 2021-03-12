---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-range"
description: "enforce using character class range"
---
# regexp/prefer-range

> enforce using character class range

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule is aimed to use ranges instead of multiple adjacent characters in character class.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-range: "error" */

/* ✓ GOOD */
var foo = /[a-c]/
var foo = /[a-f]/

/* ✗ BAD */
var foo = /[abc]/
var foo = /[a-cd-f]/

```

</eslint-code-block>

## :wrench: Options

Nothing.

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-range.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-range.ts)
