---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-misleading-capturing-group"
description: "disallow capturing groups that do not behave as one would expect"
---
# regexp/no-misleading-capturing-group

> disallow capturing groups that do not behave as one would expect

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :book: Rule Details

This rule reports ???.

<eslint-code-block>

```js
/* eslint regexp/no-misleading-capturing-group: "error" */

/* ✓ GOOD */


/* ✗ BAD */

```

</eslint-code-block>

## :wrench: Options

```json
{
  "regexp/no-misleading-capturing-group": ["error", {

  }]
}
```

-

## :books: Further reading

-

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-misleading-capturing-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-misleading-capturing-group.ts)
