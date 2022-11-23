---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-exactly-quantifier"
description: "disallow unnecessary exactly quantifier"
since: "v0.1.0"
---
# regexp/no-useless-exactly-quantifier

❌ This rule is deprecated. It was replaced by [`no-useless-quantifier`](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-quantifier.html),[`no-zero-quantifier`](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-zero-quantifier.html).

<!-- end auto-generated rule header -->

> disallow unnecessary exactly quantifier

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
