---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-misleading-unicode-character"
description: "disallow multi-code-point characters in character classes and quantifiers"
since: "v1.2.0"
---
# regexp/no-misleading-unicode-character

💼 This rule is enabled in the following configs: 🟢 `flat/recommended`, 🔵 `recommended`.

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

> disallow multi-code-point characters in character classes and quantifiers

## :book: Rule Details

This rule reports misleading Unicode characters.

Some Unicode characters like '❇️', '🏴‍☠️', and '👨‍👩‍👦' consist of multiple code points. This causes problems in character classes and around quantifiers. E.g.

```js
> /^[❇️🏴‍☠️]$/.test("🏴‍☠️")
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
var foo = /[❇️🏴‍☠️👨‍👩‍👦]❤️/;
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
