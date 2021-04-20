---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/control-character-escape"
description: "enforce consistent escaping of control characters"
since: "v0.9.0"
---
# regexp/control-character-escape

> enforce consistent escaping of control characters

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports control characters that were not escaped using a control escape (`\0`, `t`, `\n`, `\v`, `f`, `\r`).

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

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/control-character-escape.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/control-character-escape.ts)
