---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-range"
description: "disallow unnecessary range of characters by using a hyphen"
since: "v0.3.0"
---
# regexp/no-useless-range

💼 This rule is enabled in the ✅ `plugin:regexp/recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> disallow unnecessary range of characters by using a hyphen

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
