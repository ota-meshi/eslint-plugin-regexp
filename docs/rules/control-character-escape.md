---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/control-character-escape"
description: "enforce consistent escaping of control characters"
---
# regexp/control-character-escape

> enforce consistent escaping of control characters

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports ???.

<eslint-code-block fix>

```js
/* eslint regexp/control-character-escape: "error" */

/* ✓ GOOD */
var foo = /[\n\r]/;
var foo = /\t/;
var foo = RegExp("\t+\n");

/* ✗ BAD */
var foo = /	/;
var foo = /\u0009/;
var foo = /\u{a}/u;
var foo = RegExp("\\u000a");
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/control-character-escape.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/control-character-escape.ts)
