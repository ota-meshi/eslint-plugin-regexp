---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-range"
description: "enforce using character class range"
since: "v0.4.0"
---
# regexp/prefer-range

> enforce using character class range

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

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-range.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-range.ts)
