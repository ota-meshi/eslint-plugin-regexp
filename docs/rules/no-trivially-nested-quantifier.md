---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-trivially-nested-quantifier"
description: "disallow nested quantifiers that can be rewritten as one quantifier"
since: "v0.9.0"
---
# regexp/no-trivially-nested-quantifier

> disallow nested quantifiers that can be rewritten as one quantifier

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

In some cases, nested quantifiers can be rewritten as one quantifier (e.g. `(?:a{1,2}){3}` -> `a{3,6}`).

<eslint-code-block fix>

```js
/* eslint regexp/no-trivially-nested-quantifier: "error" */

/* ✓ GOOD */
var foo = /(a{1,2})+/;  // the rule won't touch capturing groups
var foo = /(?:a{2})+/;

/* ✗ BAD */
var foo = /(?:a{1,2})+/;
var foo = /(?:a{1,2}){3,4}/;
var foo = /(?:a{4,}){5}/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-trivially-nested-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-trivially-nested-quantifier.ts)
