---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-invisible-character"
description: "disallow invisible raw character"
since: "v0.1.0"
---
# regexp/no-invisible-character

> disallow invisible raw character

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule disallows using invisible characters other than SPACE (`U+0020`) without using escapes.

<eslint-code-block fix>

```js
/* eslint regexp/no-invisible-character: "error" */

/* ✓ GOOD */
var foo = /\t/;
var foo = /\v/;
var foo = /\f/;
var foo = /\u3000/;
var foo = / /; // SPACE (`U+0020`)

/* ✗ BAD */
var foo = /	/;
var foo = //;
var foo = //;
var foo = /　/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-invisible-character.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-invisible-character.ts)
