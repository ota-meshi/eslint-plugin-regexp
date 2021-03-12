---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-dupe-disjunctions"
description: "disallow duplicate disjunctions"
since: "v0.4.0"
---
# regexp/no-dupe-disjunctions

> disallow duplicate disjunctions

## :book: Rule Details

This rule disallows duplicate disjunctions.

<eslint-code-block>

```js
/* eslint regexp/no-dupe-disjunctions: "error" */

/* ✓ GOOD */
var foo = /a|b/
var foo = /(a|b)/
var foo = /(?:a|b)/

/* ✗ BAD */
var foo = /a|a/
var foo = /(a|a)/
var foo = /(?:a|a)/
var foo = /abc|abc/
var foo = /[ab]|[ba]/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-dupe-disjunctions.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-dupe-disjunctions.ts)
