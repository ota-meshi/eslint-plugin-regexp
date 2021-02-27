---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-d"
description: "enforce using `\\d`"
since: "v0.1.0"
---
# regexp/prefer-d

> enforce using `\d`

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule is aimed at using `\d` instead of `[0-9]` in regular expressions.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-d: "error" */

/* ✓ GOOD */
var foo = /\d/;
var foo = /\D/;

/* ✗ BAD */
var foo = /[0-9]/;
var foo = /[^0-9]/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-d.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-d.ts)
