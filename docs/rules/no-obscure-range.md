---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-obscure-range"
description: "disallow obscure character ranges"
---
# regexp/no-obscure-range

> disallow obscure character ranges

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

This rule reports ???.

<eslint-code-block>

```js
/* eslint regexp/no-obscure-range: "error" */

/* ✓ GOOD */
var foo = /[a-z]/;
var foo = /[J-O]/;
var foo = /[1-9]/;
var foo = /[\x00-\x40]/;
var foo = /[\0-\uFFFF]/;
var foo = /[\0-\u{10FFFF}]/u;
var foo = /[\1-\5]/;
var foo = /[\cA-\cZ]/;

/* ✗ BAD */
var foo = /[A-\x43]/;
var foo = /[\41-\x45]/;
var foo = /[*/+-^&|]/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-obscure-range.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-obscure-range.ts)
