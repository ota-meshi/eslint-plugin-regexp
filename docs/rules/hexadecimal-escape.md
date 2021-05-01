---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/hexadecimal-escape"
description: "enforce consistent usage of hexadecimal escape"
since: "v0.9.0"
---
# regexp/hexadecimal-escape

> enforce consistent usage of hexadecimal escape

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

Characters that can use hexadecimal escape can use both hexadecimal escape and unicode escape.

This rule aims is enforces the consistent use of hexadecimal escapes.

<eslint-code-block fix>

```js
/* eslint regexp/hexadecimal-escape: "error" */

/* ✓ GOOD */
var foo = /\x0a/;

/* ✗ BAD */
var foo = /\u000a/;
var foo = /\u{a}/u;
```

</eslint-code-block>

## :wrench: Options

```json5
{
  "regexp/hexadecimal-escape": [
    "error", 
    "always", // or "never"
  ]
}
```

- `"always"` ... Unicode escape characters that can use hexadecimal escape must always use hexadecimal escape. This is default.
- `"never"` ... Disallows the use of hexadecimal escapes on all characters.

### `"never"`

<eslint-code-block fix>

```js
/* eslint regexp/hexadecimal-escape: ["error", "never"] */

/* ✓ GOOD */
var foo = /\u000a/;
var foo = /\u{a}/u;

/* ✗ BAD */
var foo = /\x0a/;
```

</eslint-code-block>

## :couple: Related rules

- [regexp/unicode-escape](./unicode-escape.md)

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/hexadecimal-escape.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/hexadecimal-escape.ts)
