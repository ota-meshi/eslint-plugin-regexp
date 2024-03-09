---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-trivially-nested-assertion"
description: "disallow trivially nested assertions"
since: "v0.9.0"
---
# regexp/no-trivially-nested-assertion

💼 This rule is enabled in the following configs: 🟢 `flat/recommended`, 🔵 `recommended`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> disallow trivially nested assertions

## :book: Rule Details

Lookaround assertions that only contain another assertion can be simplified.

<eslint-code-block fix>

```js
/* eslint regexp/no-trivially-nested-assertion: "error" */

/* ✓ GOOD */
var foo = /a(?=b)/;
var foo = /a(?!$)/;

/* ✗ BAD */
var foo = /a(?=$)/;
var foo = /a(?=(?!a))/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-trivially-nested-assertion.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-trivially-nested-assertion.ts)
