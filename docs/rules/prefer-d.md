---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-d"
description: "enforce using `\\d`"
since: "v0.1.0"
---
# regexp/prefer-d

> enforce using `\d`

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

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

- `insideCharacterClass: "d"` (_default_)

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
  ```

  </eslint-code-block>

- `insideCharacterClass: "ignore"`

  Character class element will not be reported.

  <eslint-code-block fix>

  ```js
  /* eslint regexp/prefer-d: ["error", { insideCharacterClass: "ignore" }] */

  /* ✓ GOOD */
  var foo = /[\da-z]/;
  var foo = /[0-9a-z]/;

  /* ✗ BAD */
  var foo = /[0-9]/;
  ```

  </eslint-code-block>

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-d.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-d.ts)
