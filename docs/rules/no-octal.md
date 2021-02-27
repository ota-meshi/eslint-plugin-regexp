---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-octal"
description: "disallow octal escape sequence"
since: "v0.1.0"
---
# regexp/no-octal

> disallow octal escape sequence

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

This rule reports octal escape.

`\0` is matches a `NUL` character. Do not follow this with another digit, because a 0 followed by a number is an octal escape sequence.

<eslint-code-block>

```js
/* eslint regexp/no-octal: "error" */

/* ✓ GOOD */
var foo = /\0/;
var foo = /=/;

/* ✗ BAD */
var foo = /\075/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-octal.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-octal.ts)
