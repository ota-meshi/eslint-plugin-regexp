---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/use-ignore-case"
description: "use the `i` flag if it simplifies the pattern"
since: "v1.4.0"
---
# regexp/use-ignore-case

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> use the `i` flag if it simplifies the pattern

## :book: Rule Details

This rule reports regular expressions that can be simplified by adding the `i` flag.

<eslint-code-block fix>

```js
/* eslint regexp/use-ignore-case: "error" */

/* ✓ GOOD */
var foo = /\w\d+a/;
var foo = /\b0x[a-fA-F0-9]+\b/;

/* ✗ BAD */
var foo = /[a-zA-Z]/;
var foo = /\b0[xX][a-fA-F0-9]+\b/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v1.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/use-ignore-case.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/use-ignore-case.ts)
