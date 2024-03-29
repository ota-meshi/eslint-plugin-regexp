---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-unicode-codepoint-escapes"
description: "enforce use of unicode codepoint escapes"
since: "v0.3.0"
---
# regexp/prefer-unicode-codepoint-escapes

💼 This rule is enabled in the following configs: 🟢 `flat/recommended`, 🔵 `recommended`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> enforce use of unicode codepoint escapes

## :book: Rule Details

This rule enforces the use of Unicode codepoint escapes instead of Unicode escapes using surrogate pairs.

If you want to enforce characters that do not use surrogate pairs into unicode escapes or unicode code point escapes, use the [regexp/unicode-escape] rule.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-unicode-codepoint-escapes: "error" */

/* ✓ GOOD */
var foo = /\u{1f600}/u
var foo = /😀/u

/* ✗ BAD */
var foo = /\ud83d\ude00/u
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/unicode-escape]

[regexp/unicode-escape]: ./unicode-escape.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.3.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-unicode-codepoint-escapes.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-unicode-codepoint-escapes.ts)
