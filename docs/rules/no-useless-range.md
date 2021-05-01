---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-range"
description: "disallow unnecessary range of characters by using a hyphen"
since: "v0.3.0"
---
# regexp/no-useless-range

> disallow unnecessary range of characters by using a hyphen

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports unnecessary range of characters by using a hyphen. e.g. `[a-a]`

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-range: "error" */

/* ✓ GOOD */
var foo = /[a]/
var foo = /[ab]/

/* ✗ BAD */
var foo = /[a-a]/
var foo = /[a-b]/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.3.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-range.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-range.ts)
