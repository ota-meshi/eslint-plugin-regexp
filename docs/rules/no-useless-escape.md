---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-escape"
description: "disallow unnecessary escape characters in RegExp"
since: "v0.4.0"
---
# regexp/no-useless-escape

> disallow unnecessary escape characters in RegExp

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports unnecessary escape characters in RegExp.  
You may be able to find another mistake by finding unnecessary escapes.

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-escape: "error" */

/* ✓ GOOD */
var foo = /\[/
var foo = /\\/

/* ✗ BAD */
var foo = /\a/
var foo = /\x7/
var foo = /\u41/
var foo = /\u{[41]}/
```

</eslint-code-block>

This rule checks for unnecessary escapes with deeper regular expression parsing than the ESLint core's [no-useless-escape] rule.

<eslint-code-block fix>

```js
/* eslint no-useless-escape: "error" */

// no-useless-escape rule also reports it.
var foo = /\a/

// no-useless-escape rule DOES NOT report it.
var foo = /\x7/
var foo = /\u41/
var foo = /\u{[41]}/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/no-standalone-backslash]
- [no-useless-escape]

[regexp/no-standalone-backslash]: ./no-standalone-backslash.md
[no-useless-escape]: https://eslint.org/docs/rules/no-useless-escape

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-escape.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-escape.ts)
