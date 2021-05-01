---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-question-quantifier"
description: "enforce using `?` quantifier"
since: "v0.1.0"
---
# regexp/prefer-question-quantifier

> enforce using `?` quantifier

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule is aimed at using `?` quantifier instead of `{0,1}` in regular expressions.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-question-quantifier: "error" */

/* ✓ GOOD */
var foo = /a?/;

/* ✗ BAD */
var foo = /a{0,1}/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-question-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-question-quantifier.ts)
