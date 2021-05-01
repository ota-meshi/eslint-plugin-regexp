---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/sort-flags"
description: "require regex flags to be sorted"
since: "v0.9.0"
---
# regexp/sort-flags

> require regex flags to be sorted

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

The flags of JavaScript regular expressions should be sorted alphabetically
because the flags of the `.flags` property of `RegExp` objects are always
sorted. Not sorting flags in regex literals misleads readers into thinking that
the order may have some purpose which it doesn't.

<eslint-code-block fix>

```js
/* eslint regexp/sort-flags: "error" */

/* ✓ GOOD */
var foo = /abc/
var foo = /abc/iu
var foo = /abc/gimsuy

/* ✗ BAD */
var foo = /abc/mi
var foo = /abc/us
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :heart: Compatibility

This rule was taken from [eslint-plugin-clean-regex].  
This rule is compatible with [clean-regex/sort-flags] rule.

[eslint-plugin-clean-regex]: https://github.com/RunDevelopment/eslint-plugin-clean-regex
[clean-regex/sort-flags]: https://github.com/RunDevelopment/eslint-plugin-clean-regex/blob/master/docs/rules/sort-flags.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/sort-flags.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/sort-flags.ts)
