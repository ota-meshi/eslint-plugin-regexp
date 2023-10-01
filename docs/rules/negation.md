---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/negation"
description: "enforce use of escapes on negation"
since: "v0.4.0"
---
# regexp/negation

💼 This rule is enabled in the ✅ `plugin:regexp/recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> enforce use of escapes on negation

## :book: Rule Details

This rule enforces use of `\D`, `\W`, `\S` and `\P` on negation.

<eslint-code-block fix>

```js
/* eslint regexp/negation: "error" */

/* ✓ GOOD */
var foo = /\D/
var foo = /\W/
var foo = /\S/
var foo = /\P{ASCII}/u

var foo = /\d/
var foo = /\w/
var foo = /\s/
var foo = /\p{ASCII}/u

/* ✗ BAD */
var foo = /[^\d]/
var foo = /[^\w]/
var foo = /[^\s]/
var foo = /[^\p{ASCII}]/u

var foo = /[^\D]/
var foo = /[^\W]/
var foo = /[^\S]/
var foo = /[^\P{ASCII}]/u
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/simplify-set-operations]

[regexp/simplify-set-operations]: ./simplify-set-operations.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/negation.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/negation.ts)
