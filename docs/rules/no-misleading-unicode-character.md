---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-misleading-unicode-character"
description: "disallow multi-code-point characters in character classes and quantifiers"
since: "v1.2.0"
---
# regexp/no-misleading-unicode-character

> disallow multi-code-point characters in character classes and quantifiers

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

```json
{
  "regexp/no-unused-capturing-group": ["error", {
    "fixable": true
  }]
}
```

- `fixable: true | false`

  This option controls whether the rule is fixable. Defaults to `false`.

  This rule is not fixable by default. Misleading Unicode characters can typically be fixed automatically by assuming that users want to treat one displayed character as one regex character. However, this assumption is not useful in all languages, so this rule provides suggestions instead of fixes by default.

## :books: Further reading

- [no-misleading-character-class]

[no-misleading-character-class]: https://eslint.org/docs/rules/no-misleading-character-class

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v1.2.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-misleading-unicode-character.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-misleading-unicode-character.ts)
