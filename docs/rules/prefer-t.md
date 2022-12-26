---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-t"
description: "enforce using `\\t`"
since: "v0.1.0"
---
# regexp/prefer-t

❌ This rule is deprecated. It was replaced by [`regexp/control-character-escape`](../../docs/rules/control-character-escape.md).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> enforce using `\t`

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
