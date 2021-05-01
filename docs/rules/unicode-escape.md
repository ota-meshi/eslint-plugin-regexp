---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/unicode-escape"
description: "enforce consistent usage of unicode escape or unicode codepoint escape"
since: "v0.9.0"
---
# regexp/unicode-escape

> enforce consistent usage of unicode escape or unicode codepoint escape

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule aims to enforce the consistent use of unicode escapes or unicode code point escapes.

This rule does not check for characters that require surrogate pairs (e.g. `\ud83d\ude00`, `\u{1f600}`) and patterns that do not have the `u` flag.

If you want to enforce a character that requires a surrogate pair to unicode code point escape, use the [regexp/prefer-unicode-codepoint-escapes] rule.

<eslint-code-block fix>

```js
/* eslint regexp/unicode-escape: "error" */

/* ✓ GOOD */
var foo = /\u{41}/u;
var foo = /\u0041/; // do not have the `u` flag
var foo = /\ud83d\ude00/u; // surrogate pair

/* ✗ BAD */
var foo = /\u0041/u;
```

</eslint-code-block>

## :wrench: Options

```json5
{
  "regexp/unicode-escape": [
    "error",
    "unicodeCodePointEscape" // or "unicodeEscape"
  ]
}
```

- `"unicodeCodePointEscape"` ... Unicode escape characters must always use unicode code point escapes. This is default.
- `"unicodeEscape"` ... Unicode code point escape characters must always use unicode escapes.

### `"unicodeEscape"`

<eslint-code-block fix>

```js
/* eslint regexp/unicode-escape: ["error", "unicodeEscape"] */

/* ✓ GOOD */
var foo = /\u0041/u;

/* ✗ BAD */
var foo = /\u{41}/u;
```

</eslint-code-block>

## :couple: Related rules

- [regexp/hexadecimal-escape]
- [regexp/prefer-unicode-codepoint-escapes]
- [require-unicode-regexp]

[regexp/hexadecimal-escape]: ./hexadecimal-escape.md
[regexp/prefer-unicode-codepoint-escapes]: ./prefer-unicode-codepoint-escapes.md
[require-unicode-regexp]: https://eslint.org/docs/rules/require-unicode-regexp

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/unicode-escape.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/unicode-escape.ts)
