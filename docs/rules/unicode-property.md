---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/unicode-property"
description: "enforce consistent naming of unicode properties"
since: "v2.5.0"
---
# regexp/unicode-property

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> enforce consistent naming of unicode properties

## :book: Rule Details

This rule helps to enforce consistent style and naming of unicode properties.

There are many ways a single Unicode property can be expressed. E.g. `\p{L}`, `\p{Letter}`, `\p{gc=L}`, `\p{gc=Letter}`, `\p{General_Category=L}`, and `\p{General_Category=Letter}` are all equivalent. This rule can be configured in a variety of ways to control exactly which ones of those variants are allowed. The default configuration is intended to be a good starting point for most users.

<eslint-code-block fix>

```js
/* eslint regexp/unicode-property: "error" */

/* ✓ GOOD */
var re = /\p{L}/u;
var re = /\p{Letter}/u;
var re = /\p{Script=Greek}/u;
var re = /\p{scx=Greek}/u;
var re = /\p{Hex}/u;
var re = /\p{Hex_Digit}/u;

/* ✗ BAD */
var re = /\p{gc=L}/u;
var re = /\p{General_Category=Letter}/u;
var re = /\p{Script=Grek}/u;
```

</eslint-code-block>

## :wrench: Options

```json
{
  "regexp/unicode-property": ["error", {
    "generalCategory": "never",
    "key": "ignore",
    "property": {
      "binary": "ignore",
      "generalCategory": "ignore",
      "script": "long",
    }
  }]
}
```

### `generalCategory: "never" | "always" | "ignore"`

Values from the `General_Category` property can be expressed in two ways: either without or with the `gc=` (or `General_Category=`) prefix. E.g. `\p{Letter}` or `\p{gc=Letter}`.

This option controls whether the `gc=` prefix is required or forbidden.

- `"never"` (default): The `gc=` (or `General_Category=`) prefix is forbidden.
  <eslint-code-block fix>

  ```js
  /* eslint regexp/unicode-property: ["error", { generalCategory: "never" }] */

  var re = /\p{Letter}/u;
  var re = /\p{gc=Letter}/u;
  var re = /\p{General_Category=Letter}/u;
  ```

  </eslint-code-block>

- `"always"`: The `gc=` (or `General_Category=`) prefix is required.
  <eslint-code-block fix>

  ```js
  /* eslint regexp/unicode-property: ["error", { generalCategory: "always" }] */

  var re = /\p{Letter}/u;
  var re = /\p{gc=Letter}/u;
  var re = /\p{General_Category=Letter}/u;
  ```

  </eslint-code-block>

- `"ignore"`: Both with and without prefix is allowed.
  <eslint-code-block fix>

  ```js
  /* eslint regexp/unicode-property: ["error", { generalCategory: "ignore" }] */

  var re = /\p{Letter}/u;
  var re = /\p{gc=Letter}/u;
  var re = /\p{General_Category=Letter}/u;
  ```

  </eslint-code-block>

### `key: "short" | "long" | "ignore"`

Unicode properties in key-value form (e.g. `\p{gc=Letter}`, `\P{scx=Greek}`) have two variants for the key: a short and a long form. E.g. `\p{gc=Letter}` and `\p{General_Category=Letter}`.

This option controls whether the short or long form is required.

- `"short"`: The key must be in short form.
  <eslint-code-block fix>

  ```js
  /* eslint regexp/unicode-property: ["error", { key: "short", generalCategory: "ignore" }] */

  var re = /\p{gc=Letter}/u;
  var re = /\p{General_Category=Letter}/u;
  var re = /\p{sc=Greek}/u;
  var re = /\p{Script=Greek}/u;
  var re = /\p{scx=Greek}/u;
  var re = /\p{Script_Extensions=Greek}/u;
  ```

  </eslint-code-block>

- `"long"`: The key must be in long form.
  <eslint-code-block fix>

  ```js
  /* eslint regexp/unicode-property: ["error", { key: "long", generalCategory: "ignore" }] */

  var re = /\p{gc=Letter}/u;
  var re = /\p{General_Category=Letter}/u;
  var re = /\p{sc=Greek}/u;
  var re = /\p{Script=Greek}/u;
  var re = /\p{scx=Greek}/u;
  var re = /\p{Script_Extensions=Greek}/u;
  ```

  </eslint-code-block>

- `"ignore"` (default): The key can be in either form.
  <eslint-code-block fix>

  ```js
  /* eslint regexp/unicode-property: ["error", { key: "ignore", generalCategory: "ignore" }] */

  var re = /\p{gc=Letter}/u;
  var re = /\p{General_Category=Letter}/u;
  var re = /\p{sc=Greek}/u;
  var re = /\p{Script=Greek}/u;
  var re = /\p{scx=Greek}/u;
  var re = /\p{Script_Extensions=Greek}/u;
  ```

  </eslint-code-block>

### `property: "short" | "long" | "ignore" | object`

Similar to `key`, most property names also have long and short forms. E.g. `\p{Letter}` and `\p{L}`.

This option controls whether the short or long form is required. Which forms is required can be configured for each property type via an object. The object has to be of the type:

```ts
{
  binary?: "short" | "long" | "ignore",
  generalCategory?: "short" | "long" | "ignore",
  script?: "short" | "long" | "ignore",
}
```

- `binary` controls the form of Binary Unicode properties. E.g. `ASCII`, `Any`, `Hex`.
- `generalCategory` controls the form of values from the `General_Category` property. E.g. `Letter`, `Ll`, `P`.
- `script` controls the form of values from the `Script` and `Script_Extensions` properties. E.g. `Greek`.

If the option is set to a string instead of an object, it will be used for all property types.

> NOTE: The `"short"` and `"long"` options follow the [Unicode standard](https://unicode.org/Public/UCD/latest/ucd/PropertyValueAliases.txt) for short and long names. However, short names aren't always shorter than long names. E.g. the short name for `p{sc=Han}` is `\p{sc=Hani}`.
>
> There are also some properties that don't have a short name, such as `\p{sc=Thai}`, and some that have additional aliases that can be longer than the long name, such as `\p{Mark}` (long) with its short name `\p{M}` and alias `\p{Combining_Mark}`.

#### Examples

All set to `"long"`:

<eslint-code-block fix>

```js
/* eslint regexp/unicode-property: ["error", { property: "long" }] */

var re = /\p{Hex}/u;
var re = /\p{Hex_Digit}/u;
var re = /\p{L}/u;
var re = /\p{Letter}/u;
var re = /\p{sc=Grek}/u;
var re = /\p{sc=Greek}/u;
```

</eslint-code-block>

All set to `"short"`:

<eslint-code-block fix>

```js
/* eslint regexp/unicode-property: ["error", { property: "short" }] */

var re = /\p{Hex}/u;
var re = /\p{Hex_Digit}/u;
var re = /\p{L}/u;
var re = /\p{Letter}/u;
var re = /\p{sc=Grek}/u;
var re = /\p{sc=Greek}/u;
```

</eslint-code-block>

Binary properties and values of the `General_Category` property set to `"short"` and values of the `Script` property set to `"long"`:

<eslint-code-block fix>

```js
/* eslint regexp/unicode-property: ["error", { property: { binary: "short", generalCategory: "short", script: "long" } }] */

var re = /\p{Hex}/u;
var re = /\p{Hex_Digit}/u;
var re = /\p{L}/u;
var re = /\p{Letter}/u;
var re = /\p{sc=Grek}/u;
var re = /\p{sc=Greek}/u;
```

</eslint-code-block>

## :books: Further reading

- [MDN docs on Unicode property escapes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape)

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v2.5.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/unicode-property.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/unicode-property.ts)
