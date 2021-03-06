---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-non-greedy"
description: "disallow unnecessary quantifier non-greedy (`?`)"
---
# regexp/no-useless-non-greedy

> disallow unnecessary quantifier non-greedy (`?`)

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports unnecessary quantifier non-greedy (`?`).

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-non-greedy: "error" */

/* ✓ GOOD */
var foo = /a*?/;
var foo = /a+?/;
var foo = /a{4,}?/;
var foo = /a{2,4}?/;

/* ✗ BAD */
var foo = /a{1}?/;
var foo = /a{4}?/;
var foo = /a{2,2}?/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-non-greedy.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-non-greedy.ts)
