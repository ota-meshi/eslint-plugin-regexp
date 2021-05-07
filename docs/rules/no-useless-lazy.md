---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-lazy"
description: "disallow unnecessarily non-greedy quantifiers"
since: "v0.10.0"
---
# regexp/no-useless-lazy

> disallow unnecessarily non-greedy quantifiers

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports lazy quantifiers that don't need to by lazy.

There are two reasons why a lazy quantifier doesn't have to lazy:

1. It's a constant quantifier (e.g. `a{3}?`).

2. The quantifier is effectively possessive (e.g. `a+?b`).

   Whether a quantifier (let's call it _q_) is effectively possessive depends on the expression after it (let's call it _e_). _q_ is effectively possessive if _q_ cannot accept the character accepted by _e_ and _e_ cannot accept the characters accepted by _q_.

   In the example above, the character `a` and the character `b` do not overlap. Therefore the quantifier `a+` is possessive.

   Since an effectively possessive quantifier cannot give up characters to the expression after it, it doesn't matter whether the quantifier greedy or lazy. However, greedy quantifiers should be preferred because they require less characters to write and are easier to visually parse.

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-lazy: "error" */

/* ✓ GOOD */
var foo = /a*?/;
var foo = /a+?/;
var foo = /a{4,}?/;
var foo = /a{2,4}?/;
var foo = /a[\s\S]*?bar/;

/* ✗ BAD */
var foo = /a{1}?/;
var foo = /a{4}?/;
var foo = /a{2,2}?/;
var foo = /ab+?c/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.10.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-lazy.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-lazy.ts)
