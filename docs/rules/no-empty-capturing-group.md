---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-empty-capturing-group"
description: "disallow capturing group that captures empty."
---
# regexp/no-empty-capturing-group

> disallow capturing group that captures empty.

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

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

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-empty-capturing-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-empty-capturing-group.ts)
