---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/optimal-lookaround-quantifier"
description: "disallow the alternatives of lookarounds that end with a non-constant quantifier"
since: "v0.8.0"
---
# regexp/optimal-lookaround-quantifier

> disallow the alternatives of lookarounds that end with a non-constant quantifier

## :book: Rule Details

Non-constant quantifiers are quantifiers that describe a range (e.g. `?`, `*`,
`+`, `{0,1}`, `{5,9}`, `{3,}`). They have to match some number of times (the
minimum) after which further matches are optional until a certain maximum (may
be infinite) is reached.

It's obvious that `/ba{2}/` and `/ba{2,6}/` will match differently because of
the different quantifiers of `a` but that not the case if for lookarounds. Both
`/b(?=a{2})/` and `/b(?=a{2,6})/` will match strings the same way. I.e. for the
input string `"baaa"`, both will create the same match arrays. The two regular
expression are actually equivalent, meaning that `(?=a{2})` is equivalent to
`(?=a{2,6})`.

More generally, if a non-constant quantifier is an **end** of the expression
tree of a **lookahead**, that quantifier can be replaced with a constant
quantifier that matched the element minimum-if-the-non-constant-quantifier many
times. For **lookbehinds**, the non-constant quantifier has to be at the
**start** of the expression tree as lookbehinds are matched from right to left.

<eslint-code-block>

```js
/* eslint regexp/optimal-lookaround-quantifier: "error" */

/* ✓ GOOD */
// lookaheads
var foo = /\w+(?=\s*:)/;

// lookbehinds
var foo = /(?<=ab+)/;

/* ✗ BAD */
// lookaheads
var foo = /(?=ab+)/; // == /(?=ab)/
var foo = /(?=ab*)/; // == /(?=a)/
var foo = /(?!ab?)/; // == /(?!a)/
var foo = /(?!ab{6,})/; // == /(?!ab{6})/

// lookbehinds
var foo = /(?<=a+b)/; // == /(?<=ab)/
var foo = /(?<!\w*\s*,)/; // == /(?<!,)/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :heart: Compatibility

This rule was taken from [eslint-plugin-clean-regex].  
This rule is compatible with [clean-regex/optimal-lookaround-quantifier] rule.

[eslint-plugin-clean-regex]: https://github.com/RunDevelopment/eslint-plugin-clean-regex
[clean-regex/optimal-lookaround-quantifier]: https://github.com/RunDevelopment/eslint-plugin-clean-regex/blob/master/docs/rules/optimal-lookaround-quantifier.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.8.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/optimal-lookaround-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/optimal-lookaround-quantifier.ts)
