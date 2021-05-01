---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-escape-backspace"
description: "disallow escape backspace (`[\\b]`)"
since: "v0.1.0"
---
# regexp/no-escape-backspace

> disallow escape backspace (`[\b]`)

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

This rule reports `[\b]`.  
The word boundaries (`\b`) and the escape backspace (`[\b]`) are indistinguishable at a glance. This rule does not allow backspace (`[\b]`). Use unicode escapes (`\u0008`) instead.

<eslint-code-block>

```js
/* eslint regexp/no-escape-backspace: "error" */

/* ✓ GOOD */
var foo = /\b/;
var foo = /\u0008/;
var foo = /\cH/;
var foo = /\x08/;

/* ✗ BAD */
var foo = /[\b]/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-escape-backspace.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-escape-backspace.ts)
