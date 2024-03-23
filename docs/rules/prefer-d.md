---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-d"
description: "enforce using `\\d`"
since: "v0.1.0"
---
# regexp/prefer-d

💼 This rule is enabled in the following configs: 🟢 `flat/recommended`, 🔵 `recommended`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> enforce using `\d`

## :book: Rule Details

This rule is aimed at using `\d` instead of `[0-9]` in regular expressions.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-d: "error" */

/* ✓ GOOD */
var foo = /\d/;
var foo = /\D/;

/* ✗ BAD */
var foo = /[0-9]/;
var foo = /[^0-9]/;
```

</eslint-code-block>

## :wrench: Options

```json5
{
  "regexp/prefer-d": [
    "error",
    {
        "insideCharacterClass": "d"
    }
  ]
}
```

### `insideCharacterClass`

This option control how character class element equivalent to `\d` will be treated.

*Note:* This option does not affect character classes equivalent to `\d`. E.g. `[\d]`, `[0-9]`, and `[0123456789]` are unaffected.
It also does not affect expression non-nested operands equivalent to `\d`. E.g. `[\d&&x]`, and `[\d--x]` are unaffected.

- `insideCharacterClass: "d"`

  Character class element equivalent to `\d` will be reported and replaced with `\d`.

  <eslint-code-block fix>

  ```js
  /* eslint regexp/prefer-d: ["error", { insideCharacterClass: "d" }] */

  /* ✓ GOOD */
  var foo = /[\da-z]/;

  /* ✗ BAD */
  var foo = /[0-9a-z]/;
  var foo = /[0-9]/;
  ```

  </eslint-code-block>

- `insideCharacterClass: "range"`

  Character class element equivalent to `\d` will be reported and replaced with the range `0-9`.

  <eslint-code-block fix>

  ```js
  /* eslint regexp/prefer-d: ["error", { insideCharacterClass: "range" }] */

  /* ✓ GOOD */
  var foo = /[0-9a-z]/;

  /* ✗ BAD */
  var foo = /[\da-z]/;
  var foo = /[0-9]/;

  /* Ignore */
  var foo = /[\d--0]/v;
  /* ✗ BAD */
  var foo = /[[\da-z]--0]/v;
  ```

  </eslint-code-block>

- `insideCharacterClass: "ignore"` (*default*)

  Character class element will not be reported.

  <eslint-code-block fix>

  ```js
  /* eslint regexp/prefer-d: ["error", { insideCharacterClass: "ignore" }] */

  /* ✓ GOOD */
  var foo = /[\da-z]/;
  var foo = /[0-9a-z]/;

  /* ✗ BAD */
  var foo = /[0-9]/;
  var foo = /[[0-9a-z]--0]/v;
  ```

  </eslint-code-block>

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-d.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-d.ts)
