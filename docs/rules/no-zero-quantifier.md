---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-zero-quantifier"
description: "disallow quantifiers with a maximum of zero"
since: "v0.10.0"
---
# regexp/no-zero-quantifier

> disallow quantifiers with a maximum of zero

## :book: Rule Details

This rule reports quantifiers with a maximum of zero. These quantifiers trivially do not affect the pattern is any way and can be removed.

<eslint-code-block>

```js
/* eslint regexp/no-zero-quantifier: "error" */

/* ✓ GOOD */
var foo = /a?/;
var foo = /a{0,}/;
var foo = /a{0,1}/;

/* ✗ BAD */
var foo = /a{0}/;
var foo = /a{0,0}?/;
var foo = /(a){0}/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.10.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-zero-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-zero-quantifier.ts)
