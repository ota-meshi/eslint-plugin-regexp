---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-quantifier"
description: "disallow quantifiers that can be removed"
since: "v0.10.0"
---
# regexp/no-useless-quantifier

💼 This rule is enabled in the ✅ `recommended` config.

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions).

<!-- end auto-generated rule header -->

> disallow quantifiers that can be removed

## :book: Rule Details

This rule reports quantifiers that can trivially be removed without affecting the pattern.

This rule only fixes constant one quantifiers (e.g. `a{1}`). All other reported useless quantifiers hint at programmer oversight or fundamental problems with the pattern.

Examples:

- `a{1}`

  It's clear that the `{1}` quantifier can be removed.

- `(?:a+b*|c*)?`

  It might not very obvious that the `?` quantifier can be removed. Without this quantifier, that pattern can still match the empty string by choosing 0 many `c`s in the `c*` alternative.

- `(?:\b)+`

  The `+` quantifier can be removed because its quantified element doesn't consume characters.

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-quantifier: "error" */

/* ✓ GOOD */
var foo = /a*/;
var foo = /(?:a|b?)??/;
var foo = /(?:\b|(?!a))*/;

/* ✗ BAD */
var foo = /a{1}/;
var foo = /(?:\b)+/;
var foo = /(?:a+b*|c*)?/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.10.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-quantifier.ts)
