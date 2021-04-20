---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-non-standard-flag"
description: "disallow non-standard flags"
---
# regexp/no-non-standard-flag

> disallow non-standard flags

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :book: Rule Details

This rule reports non-standard flags.

Some JavaScript runtime implementations allow special flags not defined in the ECMAScript standard. These flags are experimental and should not be used in production code.

<eslint-code-block>

```js
/* eslint regexp/no-non-standard-flag: "error" */

/* ✓ GOOD */
var foo = /a*b*c/guy;

/* ✗ BAD */
var foo = /(?:a|a)*b/l;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-non-standard-flag.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-non-standard-flag.ts)
