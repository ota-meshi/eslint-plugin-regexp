---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/require-reduce-negation"
description: "require to reduce negation of character classes"
---
# regexp/require-reduce-negation

💼 This rule is enabled in the ✅ `plugin:regexp/recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> require to reduce negation of character classes

## :book: Rule Details

This rule is aimed at optimizing patterns by reducing the negation (complement) representation of character classes (with `v` flag).

<eslint-code-block fix>

```js
/* eslint regexp/require-reduce-negation: "error" */

/* ✗ BAD */
var re = /[^[^abc]]/v; // -> /[[abc]]/v
var re = /[^\D]/u; // -> /[\d]/u
var re = /[a&&[^b]]/v; // -> /[a--b]/v
var re = /[[^b]&&a]/v; // -> /[a--b]/v
var re = /[a--[^b]]/v; // -> /[a&&b]/v
var re = /[[^a]&&[^b]]/v; // -> /[^ab]/v
var re = /[[^a][^b]]/v; // -> /[^a&&b]/v

/* ✓ GOOD */
var re = /[[abc]]/v;
var re = /[\d]/u;
var re = /[\D]/u;
var re = /[a--b]/v;
var re = /[a&&b]/v;
var re = /[^ab]/v;
var re = /[^a&&b]/v;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/negation]

[regexp/negation]: ./negation.md

## :rocket: Version

:exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/require-reduce-negation.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/require-reduce-negation.ts)
