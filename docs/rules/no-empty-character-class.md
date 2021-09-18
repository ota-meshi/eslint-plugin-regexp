---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-empty-character-class"
description: "disallow empty character classes"
---
# regexp/no-empty-character-class

> disallow empty character classes

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :book: Rule Details

This rule disallows empty character classes.

This rule inspired by [no-empty-character-class] rule. The position of the report is improved over the core rule, and the argument of `new RegExp()` is also checked.

<eslint-code-block>

```js
/* eslint regexp/no-empty-character-class: "error" */

/* ✓ GOOD */
var foo = /abc[d]/;
var foo = /abc[a-z]/;
var foo = /[^]/;

/* ✗ BAD */
var foo = /abc[]/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :books: Further reading

- [no-empty-character-class]

[no-empty-character-class]: https://eslint.org/docs/rules/no-empty-character-class

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-empty-character-class.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-empty-character-class.ts)
