---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-set-operand"
description: "disallow unnecessary elements in expression character classes"
---
# regexp/no-useless-set-operand

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> disallow unnecessary elements in expression character classes

## :book: Rule Details

This rule reports ???.

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-set-operand: "error" */

/* ✓ GOOD */


/* ✗ BAD */

```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

:exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-set-operand.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-set-operand.ts)
