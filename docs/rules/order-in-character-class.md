---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/order-in-character-class"
description: "enforces elements order in character class"
---
# regexp/order-in-character-class

> enforces elements order in character class

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule checks elements of character classes are sorted.

<eslint-code-block fix>

```js
/* eslint regexp/order-in-character-class: "error" */

/* ✓ GOOD */
var foo = /[abcdef]/
var foo = /[ab-f]/

/* ✗ BAD */
var foo = /[bcdefa]/
var foo = /[b-fa]/
```

</eslint-code-block>

## :wrench: Options

```json5
{
  "regexp/order-in-character-class": ["error", {
    "order": [
      "\\s", // \s or \S
      "\\w", // \w or \W
      "\\d", // \d or \D
      "\\p", // \p{...} or \P{...}
      "*", // Others (A character or range of characters or an element you did not specify.)
    ]
  }]
}
```

- `"order"` ... An array of your preferred order. The default is `["\\s", "\\w", "\\d", "\\p", "*",]`.

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/order-in-character-class.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/order-in-character-class.ts)
