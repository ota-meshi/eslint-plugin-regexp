---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/confusing-quantifier"
description: "disallow confusing quantifiers"
since: "v0.8.0"
---
# regexp/confusing-quantifier

> disallow confusing quantifiers

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

Confusing quantifiers are ones which imply one thing but don't deliver on that.

An example of this is `(?:a?b*|c+){4}`. The group is quantified with `{4}` which
implies that at least 4 characters will be matched but this is not the case. The
whole pattern will match the empty string. It does that because in the `a?b*`
alternative, it's possible to choose 0 many `a` and `b`. So rather than `{4}`,
`{0,4}` should be used to reflect the fact that the empty string can be matched.

<eslint-code-block>

```js
/* eslint regexp/confusing-quantifier: "error" */

/* ✓ GOOD */
var foo = /a*/;
var foo = /(a|b|c)+/;
var foo = /a?/;

/* ✗ BAD */
var foo = /(a?){4}/; // warns about `{4}`
var foo = /(a?b*)+/; // warns about `+`
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :heart: Compatibility

This rule was taken from [eslint-plugin-clean-regex].  
This rule is compatible with [clean-regex/confusing-quantifier] rule.

[eslint-plugin-clean-regex]: https://github.com/RunDevelopment/eslint-plugin-clean-regex
[clean-regex/confusing-quantifier]: https://github.com/RunDevelopment/eslint-plugin-clean-regex/blob/master/docs/rules/confusing-quantifier.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.8.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/confusing-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/confusing-quantifier.ts)
