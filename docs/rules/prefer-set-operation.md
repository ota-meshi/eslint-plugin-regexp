---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-set-operation"
description: "prefer character class set operations instead of lookarounds"
---
# regexp/prefer-set-operation

💼 This rule is enabled in the ✅ `plugin:regexp/recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> prefer character class set operations instead of lookarounds

## :book: Rule Details

Regular expressions with the `v` flag have access to character class set operations (e.g. `/[\s&&\p{ASCII}]/v`, `/[\w--\d]/v`). These are more readable and performant than using lookarounds to achieve the same effect. For example, `/(?!\d)\w/v` is the same as `/[\w--\d]/v`.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-set-operation: "error" */

/* ✓ GOOD */
var foo = /(?!\d)\w/  // requires the v flag
var foo = /(?!\d)\w/u // requires the v flag

/* ✗ BAD */
var foo = /(?!\d)\w/v
var foo = /(?!\s)[\w\P{ASCII}]/v
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

:exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-set-operation.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-set-operation.ts)
