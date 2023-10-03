---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-string-literal"
description: "disallow string disjunction of single characters in `\\q{...}`"
---
# regexp/no-useless-string-literal

💼 This rule is enabled in the ✅ `plugin:regexp/recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> disallow string disjunction of single characters in `\q{...}`

## :book: Rule Details

This rule reports the string alternatives of a single character in `\q{...}`.
It can be placed outside `\q{...}`.

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-string-literal: "error" */

/* ✓ GOOD */
var foo = /[\q{abc}]/v
var foo = /[\q{ab|}]/v

/* ✗ BAD */
var foo = /[\q{a}]/v // => /[a]/v
var foo = /[\q{a|bc}]/v // => /[a\q{bc}]/v
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/no-empty-alternative]
- [regexp/no-empty-string-literal]

[regexp/no-empty-alternative]: ./no-empty-alternative.md
[regexp/no-empty-string-literal]: ./no-empty-string-literal.md

## :rocket: Version

:exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-string-literal.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-string-literal.ts)
