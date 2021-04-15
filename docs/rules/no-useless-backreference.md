---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-backreference"
description: "disallow useless backreferences in regular expressions"
since: "v0.1.0"
---
# regexp/no-useless-backreference

> disallow useless backreferences in regular expressions

## :book: Rule Details

Backreferences that will always be replaced with the empty string serve no function and can be removed.

This rule is a based on the ESLint core [no-useless-backreference] rule. It reports all the ESLint core rule reports and some more.

<eslint-code-block>

```js
/* eslint regexp/no-unused-capturing-group: "error" */

/* ✓ GOOD */
var foo = /(a)b\1/;
var foo = /(a?)b\1/;
var foo = /(\b|a)+b\1/;
var foo = /(a)?(?:a|\1)/;

/* ✗ BAD */
var foo = /\1(a)/;
var foo = /(a\1)/;
var foo = /(a)|\1/;
var foo = /(?:(a)|\1)+/;
var foo = /(\b)a\1/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :books: Further reading

- [no-useless-backreference]

[no-useless-backreference]: https://eslint.org/docs/rules/no-useless-backreference

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-backreference.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-backreference.ts)
