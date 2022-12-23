---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-empty-capturing-group"
description: "disallow capturing group that captures empty."
since: "v0.12.0"
---
# regexp/no-empty-capturing-group

💼 This rule is enabled in the ✅ `plugin:regexp/recommended` config.

<!-- end auto-generated rule header -->

> disallow capturing group that captures empty.

## :book: Rule Details

This rule reports capturing group that captures assertions.

<eslint-code-block>

```js
/* eslint regexp/no-empty-capturing-group: "error" */

/* ✓ GOOD */
var foo = /(a)/;
var foo = /a(?:\b)/;
var foo = /a(?:$)/;
var foo = /(?:^)a/;
var foo = /(?:^|b)a/;

/* ✗ BAD */
var foo = /a(\b)/;
var foo = /a($)/;
var foo = /(^)a/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.12.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-empty-capturing-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-empty-capturing-group.ts)
