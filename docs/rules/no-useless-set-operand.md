---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-set-operand"
description: "disallow unnecessary elements in expression character classes"
since: "v2.0.0-next.10"
---
# regexp/no-useless-set-operand

💼 This rule is enabled in the following configs: 🟢 `flat/recommended`, 🔵 `recommended`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> disallow unnecessary elements in expression character classes

## :book: Rule Details

The `v` flag added set operations for character classes, e.g. `[\w&&\D]` and `[\w--\d]`, but there are no limitations on what operands can be used. This rule reports any unnecessary operands.

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-set-operand: "error" */

/* ✓ GOOD */
foo = /[\w--\d]/v
foo = /[\w--[\d_]]/v

/* ✗ BAD */
foo = /[\w--[\d$]]/v
foo = /[\w&&\d]/v
foo = /[\w&&\s]/v
foo = /[\w&&[\d\s]]/v
foo = /[\w&&[^\d\s]]/v
foo = /[\w--\s]/v
foo = /[\d--\w]/v
foo = /[\w--[\d\s]]/v
foo = /[\w--[^\d\s]]/v

```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v2.0.0-next.10

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-set-operand.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-set-operand.ts)
