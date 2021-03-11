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

This rule is aimed to unify the case of letters.

<eslint-code-block fix>

```js
/* eslint regexp/letter-case: ["error", { hexadecimalEscape: 'lowercase', controlEscape: 'uppercase' }] */

/* ✓ GOOD */
var foo = /a/i
var foo = /\u000a/
var foo = /\x0a/
var foo = /\cA/

/* ✗ BAD */
var foo = /A/i
var foo = /\u000A/
var foo = /\x0A/
var foo = /\ca/
```

</eslint-code-block>

## :wrench: Options

```json5
{
  "regexp/letter-case": ["error", {
    "caseInsensitive": "lowercase", // or "uppercase" or "ignore"
    "unicodeEscape": "lowercase", // or "uppercase" or "ignore"
    "hexadecimalEscape": "ignore", // or "lowercase" or "uppercase"
    "controlEscape": "ignore", // or "lowercase" or "uppercase"
  }]
}
```

- String options
  - `"lowercase"` ... Enforce lowercase letters.
  - `"uppercase"` ... Enforce uppercase letters.
  - `"ignore"` ... Does not force case.
- Properties
  - `caseInsensitive` ... Specifies the letter case when the `i` flag is present. Default is `"lowercase"`.
  - `unicodeEscape` ... Specifies the letter case when the unicode escapes. Default is `"lowercase"`.
  - `hexadecimalEscape` ... Specifies the letter case when the hexadecimal escapes. Default is `"ignore"`.  
    (The default value will change to `"lowercase"` in the next major version.)
  - `controlEscape` ... Specifies the letter case when the control escapes (e.g. `\cX`). Default is `"ignore"`.  
    (The default value will change to `"uppercase"` in the next major version.)

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.3.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/letter-case.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/letter-case.ts)
