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
var re = /[^[^abc]]/v; // -> /[abc]/v
var re = /[^\D]/u; // -> /[\d]/u
var re = /[a&&[^b]]/v; // -> /[a--b]/v
var re = /[[^b]&&a]/v; // -> /[a--b]/v
var re = /[a--[^b]]/v; // -> /[a&&b]/v
var re = /[[^a]&&[^b]]/v; // -> /[^ab]/v
var re = /[[^a][^b]]/v; // -> /[^a&&b]/v

/* ✓ GOOD */
var re = /[abc]/v;
var re = /[\d]/u;
var re = /[\D]/u;
var re = /[a--b]/v;
var re = /[a&&b]/v;
var re = /[^ab]/v;
var re = /[^a&&b]/v;
```

</eslint-code-block>

### How does this rule work?

This rule attempts to reduce complements in several ways:

#### Double negation elimination

This rule look for patterns that can eliminate double negatives, report on them, and auto-fix them.\
For example, `/[^[^abc]]/v` is equivalent to `/[abc]/v`.

See <https://en.wikipedia.org/wiki/Double_negation#Elimination_and_introduction>.

#### De Morgan's laws

This rule uses De Morgan's laws to look for patterns that can convert multiple negations into a single negation, reports on them, auto-fix them.\
For example, `/[[^a]&&[^b]]/v` is equivalent to `/[^ab]/v`, `/[[^a][^b]]/v` is equivalent to `/[^a&&b]/v`.

See <https://en.wikipedia.org/wiki/De_Morgan's_laws>.

#### Conversion from the intersection to the subtraction

Intersection sets with complement operands can be converted to difference sets.\
The rule looks for character class intersection with negation operands, reports on them, auto-fix them.\
For example, `/[a&&[^b]]/v` is equivalent to `/[a--b]/v`, `/[[^a]&&b]/v` is equivalent to `/[b--a]/v`.

#### Conversion from the subtraction to the intersection

Difference set with a complement operand on the right side can be converted to intersection sets.\
The rule looks for character class subtraction with negation operand on the right side, reports on them, auto-fix them.\
For example, `/[a--[^b]]/v` is equivalent to `/[a&&b]/v`.

### Auto Fixes

This rule's auto-fix does not remove unnecessary brackets. For example, `/[[^a]&&[^b]]/v` will be automatically fixed to `/[[a][b]]/v`.\
If you want to remove unnecessary brackets (e.g. auto-fixed to `/[^ab]/v`), use [regexp/no-useless-character-class] rule together.

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/negation]
- [regexp/no-useless-character-class]

[regexp/negation]: ./negation.md
[regexp/no-useless-character-class]: ./no-useless-character-class.md

## :rocket: Version

:exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/require-reduce-negation.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/require-reduce-negation.ts)
