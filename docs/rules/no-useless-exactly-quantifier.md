---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-exactly-quantifier"
description: "disallow unnecessary exactly quantifier"
---
# regexp/no-useless-exactly-quantifier

> disallow unnecessary exactly quantifier

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

This rule reports `{0}` or `{1}` quantifiers.

<eslint-code-block >

```js
/* eslint regexp/no-useless-exactly-quantifier: "error" */

/* ✓ GOOD */
var foo = /a/

/* ✗ BAD */
var foo = /a{1}/
var foo = /a{0}/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-exactly-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-exactly-quantifier.js)
