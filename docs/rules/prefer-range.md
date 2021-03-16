---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-range"
description: "enforce using character class range"
since: "v0.4.0"
---
# regexp/prefer-range

> enforce using character class range

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule is aimed to use ranges instead of multiple adjacent characters in character class.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-range: "error" */

/* ✓ GOOD */
var foo = /[a-c]/
var foo = /[a-f]/

/* ✗ BAD */
var foo = /[abc]/
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

- `target` ... Specify the range of characters you want to check with this rule.
  - `"alphanumeric"` ... Check only alphanumeric characters (`0-9`,`a-z` and `A-Z`). This is the default.
  - `"all"` ... Check all characters. Use `"all"`, if you want to focus on regular expression optimization.
  - `[...]` (Array) ... Specify as an array of character ranges. List the character ranges that your team is familiar with in this option, and replace redundant contiguous characters with ranges.
    Specify the range as a three-character string in which the from and to characters are connected with a hyphen (`-`) using. e.g. `"!-/"` (U+0021 - U+002F), `"😀-😏"` (U+1F600 - U+1F60F)  
    You can also use `"alphanumeric"`.

### `"target": "alphanumeric"` (Default)

<eslint-code-block fix>

```js
/* eslint regexp/prefer-range: ["error", { "target": "alphanumeric" }] */

/* ✓ GOOD */
var foo = /[a-c]/
var foo = /[a-f]/
var foo = /[!-$]/
var foo = /[!"#$]/
var foo = /[😀-😄]/u
var foo = /[😀😁😂😃😄]/u

/* ✗ BAD */
var foo = /[abc]/
var foo = /[a-cd-f]/
```

</eslint-code-block>

### `"target": "all"`

<eslint-code-block fix>

```js
/* eslint regexp/prefer-range: ["error", { "target": "all" }] */

/* ✓ GOOD */
var foo = /[a-c]/
var foo = /[a-f]/
var foo = /[!-$]/
var foo = /[😀-😄]/u

/* ✗ BAD */
var foo = /[abc]/
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
var foo = /[a-c]/
var foo = /[a-f]/
var foo = /[!-$]/
var foo = /[!"#$]/
var foo = /[😀-😄]/u

/* ✗ BAD */
var foo = /[abc]/
var foo = /[a-cd-f]/
var foo = /[😀😁😂😃😄]/u
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-range.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-range.ts)
