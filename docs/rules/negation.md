---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/negation"
description: "enforce use of escapes on negation"
since: "v0.4.0"
---
# regexp/negation

> enforce use of escapes on negation

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

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

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/negation.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/negation.ts)
