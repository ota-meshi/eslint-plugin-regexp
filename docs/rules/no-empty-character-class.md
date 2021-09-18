---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-empty-character-class"
description: "disallow character classes that does not match all characters"
---
# regexp/no-empty-character-class

> disallow character classes that does not match all characters

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :book: Rule Details

This rule reports character classes that cannot match any characters.

Character classes that cannot match any characters are either empty or negated character classes of elements that contain all characters.

The reports for this rule include reports for the ESLint core [no-empty-character-class] rule. That is, if you use this rule, you can turn off the ESLint core [no-empty-character-class] rule.

<eslint-code-block>

```js
/* eslint regexp/no-empty-character-class: "error" */

/* ✓ GOOD */
var foo = /abc[d]/;
var foo = /abc[a-z]/;
var foo = /[^]/;
var foo = /[\s\S]/;

/* ✗ BAD */
var foo = /abc[]/;
var foo = /[^\s\S]/;
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
