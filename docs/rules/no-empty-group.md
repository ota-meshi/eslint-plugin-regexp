---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-empty-group"
description: "disallow empty group"
since: "v0.1.0"
---
# regexp/no-empty-group

💼 This rule is enabled in the ✅ `plugin:regexp/recommended` config.

<!-- end auto-generated rule header -->

> disallow empty group

## :book: Rule Details

This rule reports empty groups.

<eslint-code-block>

```js
/* eslint regexp/no-empty-group: "error" */

/* ✓ GOOD */
var foo = /(a)/;
var foo = /(?:a)/;

/* ✗ BAD */
// capturing group
var foo = /()/;
var foo = /(|)/;
// non-capturing group
var foo = /(?:)/;
var foo = /(?:|)/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-empty-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-empty-group.ts)
