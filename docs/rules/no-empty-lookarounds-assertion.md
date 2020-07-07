---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-empty-lookarounds-assertion"
description: "disallow empty lookahead assertion or empty lookbehind assertion"
---
# regexp/no-empty-lookarounds-assertion

> disallow empty lookahead assertion or empty lookbehind assertion

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

This rule reports empty lookahead assertion or empty lookbehind assertion.

<eslint-code-block >

```js
/* eslint regexp/no-empty-lookarounds-assertion: "error" */

/* ✓ GOOD */
var foo = /x(?=y)/;
var foo = /x(?!y)/;
var foo = /(?<=y)x/;
var foo = /(?<!y)x/;

/* ✗ BAD */
var foo = /x(?=)/;
var foo = /x(?!)/;
var foo = /(?<=)x/;
var foo = /(?<!)x/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-empty-lookarounds-assertion.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-empty-lookarounds-assertion.js)
