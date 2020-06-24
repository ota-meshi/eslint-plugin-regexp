---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-empty-group"
description: "disallow empty group"
---
# regexp/no-empty-group

> disallow empty group

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

This rule reports empty groups.

<eslint-code-block >

```js
/* eslint regexp/no-empty-group: "error" */

/* ✓ GOOD */
var foo = /(a)/
var foo = /(?:a)/

/* ✗ BAD */
// capturing group
var foo = /()/
var foo = /(|)/
// non-capturing group
var foo = /(?:)/
var foo = /(?:|)/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-empty-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-empty-group.js)
