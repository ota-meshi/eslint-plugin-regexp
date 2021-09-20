---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-misleading-unicode-character"
description: "disallow multi-code-point characters in character classes and quantifiers"
---
# regexp/no-misleading-unicode-character

> disallow multi-code-point characters in character classes and quantifiers

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports misleading Unicode characters.

Some Unicode characters like '❇️', '🏳️‍🌈', and '👨‍👩‍👦' consist of multiple code points. This causes problems in character classes and around quantifiers. E.g.

```js
> /^[❇️🏳️‍🌈]$/.test("🏳️‍🌈")
false
> /^👨‍👩‍👦{2,4}$/.test("👨‍👩‍👦👨‍👩‍👦")
false
```

This rule is inspired by the [no-misleading-character-class] rule.

<eslint-code-block fix>

```js
/* eslint regexp/no-misleading-unicode-character: "error" */

/* ✓ GOOD */
var foo = /👍+/u;
var foo = /👨‍👩‍👦/;

/* ✗ BAD */
var foo = /👍+/;
var foo = /[❇️🏳️‍🌈👨‍👩‍👦]❤️/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :books: Further reading

- [no-misleading-character-class]

[no-misleading-character-class]: https://eslint.org/docs/rules/no-misleading-character-class

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-misleading-unicode-character.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-misleading-unicode-character.ts)
