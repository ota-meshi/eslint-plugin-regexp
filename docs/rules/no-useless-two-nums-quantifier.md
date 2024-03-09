---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-two-nums-quantifier"
description: "disallow unnecessary `{n,m}` quantifier"
since: "v0.1.0"
---
# regexp/no-useless-two-nums-quantifier

💼 This rule is enabled in the following configs: 🟢 `flat/recommended`, 🔵 `recommended`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> disallow unnecessary `{n,m}` quantifier

## :book: Rule Details

This rule reports unnecessary `{n,m}` quantifiers.

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-two-nums-quantifier: "error" */

/* ✓ GOOD */
var foo = /a{0,1}/;
var foo = /a{1,5}/;
var foo = /a{1,}/;
var foo = /a{2}/;

/* ✗ BAD */
var foo = /a{0,0}/;
var foo = /a{1,1}/;
var foo = /a{2,2}/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-two-nums-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-two-nums-quantifier.ts)
