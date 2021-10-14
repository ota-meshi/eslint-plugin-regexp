---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-range"
description: "enforce using character class range"
since: "v0.4.0"
---
# regexp/prefer-range

> enforce using character class range

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule is aimed to use ranges instead of multiple adjacent characters in character class.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-range: "error" */

/* ✓ GOOD */
var foo = /[0-9]/
var foo = /[a-f]/

/* ✗ BAD */
var foo = /[123456]/
var foo = /[a-cd-f]/
```

</eslint-code-block>

## :wrench: Options

```json5
{
  "regexp/prefer-range": ["error",
    {
      "target": "alphanumeric" // or "all" or [...]
    }
  ]
}
```

This option can be used to override the [allowedCharacterRanges] setting.

It allows all values that the [allowedCharacterRanges] setting allows.

[allowedCharacterRanges]: ../settings/README.md#allowedCharacterRanges

### `"target": "alphanumeric"`

<eslint-code-block fix>

```js
/* eslint regexp/prefer-range: ["error", { "target": "alphanumeric" }] */

/* ✓ GOOD */
var foo = /[0-9]/
var foo = /[a-f]/
var foo = /[!-$]/
var foo = /[!"#$]/
var foo = /[😀-😄]/u
var foo = /[😀😁😂😃😄]/u

/* ✗ BAD */
var foo = /[123456]/
var foo = /[a-cd-f]/
```

</eslint-code-block>

### `"target": "all"`

<eslint-code-block fix>

```js
/* eslint regexp/prefer-range: ["error", { "target": "all" }] */

/* ✓ GOOD */
var foo = /[0-9]/
var foo = /[a-f]/
var foo = /[!-$]/
var foo = /[😀-😄]/u

/* ✗ BAD */
var foo = /[123456]/
var foo = /[a-cd-f]/
var foo = /[!"#$]/
var foo = /[😀😁😂😃😄]/u
```

</eslint-code-block>

### `"target": [ "alphanumeric", "😀-😏" ]`

<eslint-code-block fix>

```js
/* eslint regexp/prefer-range: ["error", { "target": [ "alphanumeric", "😀-😏" ] }] */

/* ✓ GOOD */
var foo = /[0-9]/
var foo = /[a-f]/
var foo = /[!-$]/
var foo = /[!"#$]/
var foo = /[😀-😄]/u

/* ✗ BAD */
var foo = /[123456]/
var foo = /[a-cd-f]/
var foo = /[😀😁😂😃😄]/u
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-range.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-range.ts)
