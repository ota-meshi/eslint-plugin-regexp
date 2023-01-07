---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-w"
description: "enforce using `\\w`"
since: "v0.1.0"
---
# regexp/prefer-w

💼 This rule is enabled in the ✅ `plugin:regexp/recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> enforce using `\w`

## :book: Rule Details

This rule is aimed at using `\w` in regular expressions.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-w: "error" */

/* ✓ GOOD */
var foo = /\w/;
var foo = /\W/;

/* ✗ BAD */
var foo = /[0-9a-zA-Z_]/;
var foo = /[^0-9a-zA-Z_]/;
var foo = /[0-9a-z_]/i;
var foo = /[0-9a-z_-]/i;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-w.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-w.ts)
