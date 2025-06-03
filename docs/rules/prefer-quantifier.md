---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-quantifier"
description: "enforce using quantifier"
since: "v0.2.0"
---
# regexp/prefer-quantifier

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> enforce using quantifier

## :book: Rule Details

This rule is aimed to use quantifiers instead of consecutive characters in regular expressions.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-quantifier: "error" */

/* ✓ GOOD */
var foo = /\d{4}-\d{2}-\d{2}/;

/* ✗ BAD */
var foo = /\d\d\d\d-\d\d-\d\d/;
```

</eslint-code-block>

## :wrench: Options

```json
{
  "regexp/prefer-quantifier": ["error", {
    "allows": ["www", "\\d\\d"]
  }]
}
```

- `"allows"` ... Array of allowed patterns.

### `{ "allows": ["www", "\\d\\d"] }`

<eslint-code-block fix>

```js
/* eslint regexp/prefer-quantifier: ["error", { "allows": ["www", "\\d\\d"] }] */

/* ✓ GOOD */
var foo = /(?:www\.)?(.*)/;
var foo = /\d\d:\d\d/;

/* ✗ BAD */
var foo = /wwww/;
var foo = /\d\d\d\d/;
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.2.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-quantifier.ts)
