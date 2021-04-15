---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-trivially-nested-assertion"
description: "disallow trivially nested assertions"
---
# regexp/no-trivially-nested-assertion

> disallow trivially nested assertions

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

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

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-trivially-nested-assertion.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-trivially-nested-assertion.ts)
