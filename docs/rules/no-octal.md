---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-octal"
description: "disallow octal escape sequence"
since: "v0.1.0"
---
# regexp/no-octal

> disallow octal escape sequence

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

This rule reports octal escapes.

`\0` matches the `NUL` character. However, if `\0` is followed by another digit, it will become an octal escape sequence (e.g. `\07`).

Octal escapes can also easily be confused with backreferences. The same character sequence (e.g. `\3`) can either escape a character or be a backreference depending on the number of capturing groups in the pattern. E.g. the `\2` in `/(a)\2/` is a character but the `\2` in `/(a)(b)\2/` is a backreference. This can be a problem when refactoring regular expressions because an octal escape can become a backreference or vice versa.

<eslint-code-block>

```js
/* eslint regexp/no-octal: "error" */

/* ✓ GOOD */
var foo = /\0/;
var foo = /=/;
var foo = /(a)\1/;

/* ✗ BAD */
var foo = /\075/;
var foo = /\1/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-octal.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-octal.ts)
