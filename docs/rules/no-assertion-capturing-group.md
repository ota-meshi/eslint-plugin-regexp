---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-assertion-capturing-group"
description: "disallow capturing group that captures assertions."
---
# regexp/no-assertion-capturing-group

> disallow capturing group that captures assertions.

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

This rule reports capturing group that captures assertions.

<eslint-code-block >

```js
/* eslint regexp/no-assertion-capturing-group: "error" */

/* ✓ GOOD */
var foo = /(a)/
var foo = /a(?:\b)/
var foo = /a(?:$)/
var foo = /(?:^)a/

/* ✗ BAD */
var foo = /a(\b)/
var foo = /a($)/
var foo = /(^)a/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-assertion-capturing-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-assertion-capturing-group.js)
