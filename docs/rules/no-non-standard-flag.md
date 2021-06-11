---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-non-standard-flag"
description: "disallow non-standard flags"
since: "v0.9.0"
---
# regexp/no-non-standard-flag

> disallow non-standard flags

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

This rule reports non-standard flags.

Some JavaScript runtime implementations allow special flags not defined in the ECMAScript standard. These flags are experimental and should not be used in production code.

<eslint-code-block>

```js
/* eslint regexp/no-non-standard-flag: "error" */

/* ✓ GOOD */
var foo = /a*b*c/guy;

/* ✗ BAD */
var foo = RegExp("(?:a|a)*b", "l");
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-non-standard-flag.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-non-standard-flag.ts)
