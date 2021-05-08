---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-t"
description: "enforce using `\\t`"
since: "v0.1.0"
---
# regexp/prefer-t

> enforce using `\t`

- :warning: This rule was **deprecated** and replaced by [regexp/control-character-escape](control-character-escape.md) rule.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule is aimed at using `\t` in regular expressions.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-t: "error" */

/* ✓ GOOD */
var foo = /\t/;

/* ✗ BAD */
var foo = /\u0009/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-t.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-t.ts)
