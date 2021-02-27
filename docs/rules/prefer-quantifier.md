---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-quantifier"
description: "enforce using quantifier"
---
# regexp/prefer-quantifier

> enforce using quantifier

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule is aimed to use quantifiers instead of consecutive characters in regular expressions.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-quantifier: "error" */

/* ✓ GOOD */
var foo = /\d{4}-\d{2}-\d{2}/;

/* ✗ BAD */
var foo = /\d\d\d\d-\d\d-\d\d/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-quantifier.ts)
