---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-lazy-ends"
description: "disallow lazy quantifiers at the end of an expression"
---
# regexp/no-lazy-ends

> disallow lazy quantifiers at the end of an expression

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-lazy-ends"
description: "disallow lazy quantifiers at the end of an expression"
since: "v0.8.0"
---
# regexp/no-lazy-ends

> disallow lazy quantifiers at the end of an expression

## :book: Rule Details

If a lazily quantified element is the last element matched by an expression
(e.g. the `a{2,3}?` in `b+a{2,3}?`), we know that the lazy quantifier will
always only match the element the minimum number of times. The maximum is
completely ignored because the expression can accept after the minimum was
reached.

If the minimum of the lazy quantifier is 0, we can even remove the quantifier
and the quantified element without changing the meaning of the pattern. E.g.
`a+b*?` and `a+` behave the same.

If the minimum is 1, we can remove the quantifier. E.g. `a+b+?` and `a+b` behave
the same.

If the minimum is greater than 1, we can replace the quantifier with a constant,
greedy quantifier. E.g. `a+b{2,4}?` and `a+b{2}` behave the same.

<eslint-code-block>

```js
/* eslint regexp/no-lazy-ends: "error" */

/* ✓ GOOD */
var foo = /a+?b*/
var foo = /a??(?:ba+?|c)*/
var foo = /ba*?$/

/* ✗ BAD */
var foo = /a??/
var foo = /a+b+?/
var foo = /a(?:c|ab+?)?/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :heart: Compatibility

This rule was taken from [eslint-plugin-clean-regex].  
This rule is compatible with [clean-regex/no-lazy-ends] rule.

[eslint-plugin-clean-regex]: https://github.com/RunDevelopment/eslint-plugin-clean-regex
[clean-regex/no-lazy-ends]: https://github.com/RunDevelopment/eslint-plugin-clean-regex/blob/master/docs/rules/no-lazy-ends.md

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-lazy-ends.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-lazy-ends.ts)
