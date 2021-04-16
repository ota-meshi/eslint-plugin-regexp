---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-trivially-nested-quantifier"
description: "disallow nested quantifiers that can be rewritten as one quantifier"
---
# regexp/no-trivially-nested-quantifier

> disallow nested quantifiers that can be rewritten as one quantifier

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports ???.

<eslint-code-block fix>

```js
/* eslint regexp/no-trivially-nested-quantifier: "error" */

/* ✓ GOOD */


/* ✗ BAD */

```

</eslint-code-block>

## :wrench: Options

```json
{
  "regexp/no-trivially-nested-quantifier": ["error", {
   
  }]
}
```

- 

## :books: Further reading

-

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-trivially-nested-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-trivially-nested-quantifier.ts)
