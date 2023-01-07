---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/sort-character-class-elements"
description: "enforces elements order in character class"
since: "v0.12.0"
---
# regexp/sort-character-class-elements

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> enforces elements order in character class

## :book: Rule Details

This rule checks elements of character classes are sorted.

<eslint-code-block fix>

```js
/* eslint regexp/sort-character-class-elements: "error" */

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
  "regexp/sort-character-class-elements": ["error", {
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

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.12.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/sort-character-class-elements.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/sort-character-class-elements.ts)
