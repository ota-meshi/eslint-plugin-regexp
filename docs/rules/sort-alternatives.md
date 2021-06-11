---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/sort-alternatives"
description: "sort alternatives if order doesn't matter"
since: "v0.12.0"
---
# regexp/sort-alternatives

> sort alternatives if order doesn't matter

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule will sort alternatives to improve readability and maintainability.

The primary target of this rule are lists of words and/or numbers. These lists are somewhat common and sorting them makes it easy for readers to check whether a particular word or number is included.

This rule will only sort alternatives if reordering the alternatives doesn't affect the pattern.

<eslint-code-block fix>

```js
/* eslint regexp/sort-alternatives: "error" */

/* ✓ GOOD */
var foo = /\b(1|2|3)\b/;
var foo = /\b(alpha|beta|gamma)\b/;

/* ✗ BAD */
var foo = /\b(2|1|3)\b/;
var foo = /__(?:Foo|Bar)__/;
var foo = /\((?:TM|R|C)\)/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.12.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/sort-alternatives.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/sort-alternatives.ts)
