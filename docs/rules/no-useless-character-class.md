---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-character-class"
description: "disallow character class with one character"
since: "v0.3.0"
---
# regexp/no-useless-character-class

> disallow character class with one character

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports character classes that defines only one character.

Character classes that define only one character have the same effect even if you remove the brackets.

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-character-class: "error" */

/* ✓ GOOD */
var foo = /abc/;

/* ✗ BAD */
var foo = /a[b]c/;
```

</eslint-code-block>

## :wrench: Options

```json
{
  "regexp/no-useless-character-class": ["error", {
    "ignores": ["="]
  }]
}
```

- `"ignores"` ... An array of characters and character classes to ignores. Default `["="]`.

The default value is `"="` to prevent conflicts with the [no-div-regex] rule. Note that if you do not specify `"="`, there may be conflicts with the [no-div-regex] rule.

### `"ignores": ["a"]`

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-character-class: ["error", { "ignores": ["a"] }] */

/* ✓ GOOD */
var foo = /[a]bc/;

/* ✗ BAD */
var foo = /a[b]c/;
```

</eslint-code-block>

## :couple: Related rules

- [no-empty-character-class]
- [no-div-regex]

[no-empty-character-class]: https://eslint.org/docs/rules/no-empty-character-class
[no-div-regex]: https://eslint.org/docs/rules/no-div-regex

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.3.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-character-class.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-character-class.ts)
