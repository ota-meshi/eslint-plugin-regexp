---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-character-class"
description: "enforce using character class"
since: "v0.4.0"
---
# regexp/prefer-character-class

> enforce using character class

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

Instead of single-character alternatives (e.g. `(?:a|b|c)`), character classes (e.g. `[abc]`) should be preferred.

The main reason for doing this is performance. Character classes don't require backtracking and are heavily optimized by the regex engine. On the other hand, alternatives are usually quite tricky to optimize.

Character classes are also safer than alternatives because they don't require backtracking. While `^(?:\w|a)+b$` will take _O(2^n)_ time to reject a string of _n_ many `a`s, the regex `^[\wa]+b$` will reject a string of _n_ many `a`s in _O(n)_.

### Limitations

This rule might not be able to merge all single-character alternatives.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-character-class: "error" */

/* ✓ GOOD */
var foo = /[abc]/
var foo = /(?:a|b)/

/* ✗ BAD */
var foo = /a|b|c/
var foo = /(a|b|c)c/
var foo = /.|\s/
var foo = /(\w|\d)+:/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-character-class.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-character-class.ts)
