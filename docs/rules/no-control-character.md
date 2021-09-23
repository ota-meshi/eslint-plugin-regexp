---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-control-character"
description: "disallow control characters"
---
# regexp/no-control-character

> disallow control characters

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :book: Rule Details

This rule reports control characters.

This rule is inspired by the [no-control-regex] rule. The positions of reports are improved over the core rule and suggestions are provided in some cases.

<eslint-code-block>

```js
/* eslint regexp/no-control-character: "error" */

/* ✓ GOOD */
var foo = /\n/;
var foo = RegExp("\n");

/* ✗ BAD */
var foo = /\x1f/;
var foo = /\x0a/;
var foo = RegExp('\x0a');
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :books: Further reading

- [no-control-regex]

[no-control-regex]: https://eslint.org/docs/rules/no-control-regex

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-control-character.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-control-character.ts)
