---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/letter-case"
description: "enforce into your favorite case"
since: "v0.3.0"
---
# regexp/letter-case

> enforce into your favorite case

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule aims to unify the case of letters.

<eslint-code-block fix>

```js
/* eslint regexp/letter-case: "error" */

/* ✓ GOOD */
var foo = /a/i
var foo = /\u000a/

/* ✗ BAD */
var foo = /A/i
var foo = /\u000A/
```

</eslint-code-block>

## :wrench: Options

```json5
{
  "regexp/letter-case": ["error", {
    "caseInsensitive": "lowercase", // or "uppercase" or "ignore"
    "unicodeEscape": "lowercase" // or "uppercase" or "ignore"
  }]
}
```

- String options
  - `"lowercase"` ... Enforce lowercase letters. This is default.
  - `"uppercase"` ... Enforce uppercase letters.
  - `"ignore"` ... Does not force case.
- Properties
  - `caseInsensitive` ... Specifies the letter case when the `i` flag is present.
  - `unicodeEscape` ... Specifies the letter case when the unicode escapes.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.3.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/letter-case.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/letter-case.ts)
