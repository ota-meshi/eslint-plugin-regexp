---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-regexp-test"
description: "enforce that `RegExp#test` is used instead of `String#match` and `RegExp#exec`"
since: "v0.3.0"
---
# regexp/prefer-regexp-test

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> enforce that `RegExp#test` is used instead of `String#match` and `RegExp#exec`

## :book: Rule Details

This rule is aimed to use `RegExp#test` to check if a pattern matches a string.

This rule inspired by [unicorn/prefer-regexp-test rule](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-regexp-test.md).

<eslint-code-block fix>

```js
/* eslint regexp/prefer-regexp-test: "error" */

const text = 'something';
const pattern = /thing/;

/* ✓ GOOD */
if (pattern.test(text)) {}

/* ✗ BAD */
if (pattern.exec(text)) {}
if (text.match(pattern)) {}
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :books: Further reading

- [unicorn/prefer-regexp-test](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-regexp-test.md)

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.3.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-regexp-test.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-regexp-test.ts)
