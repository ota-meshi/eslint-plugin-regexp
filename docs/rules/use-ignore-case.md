---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/use-ignore-case"
description: "use the `i` flag if it simplifies the pattern"
---
# regexp/use-ignore-case

> use the `i` flag if it simplifies the pattern

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

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

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/use-ignore-case.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/use-ignore-case.ts)
