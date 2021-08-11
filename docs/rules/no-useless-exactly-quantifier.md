---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-exactly-quantifier"
description: "disallow unnecessary exactly quantifier"
since: "v0.1.0"
---
# regexp/no-useless-exactly-quantifier

> disallow unnecessary exactly quantifier

- :warning: This rule was **deprecated** and replaced by [regexp/no-useless-quantifier](no-useless-quantifier.md) rule and [regexp/no-zero-quantifier](no-zero-quantifier.md) rule.

## :book: Rule Details

This rule reports `{0}` or `{1}` quantifiers.

<eslint-code-block>

```js
/* eslint regexp/no-useless-exactly-quantifier: "error" */

/* ✓ GOOD */
var foo = /a/;

/* ✗ BAD */
var foo = /a{1}/;
var foo = /a{0}/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-exactly-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-exactly-quantifier.ts)
