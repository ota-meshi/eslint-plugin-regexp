---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/match-any"
description: "enforce match any character style"
since: "v0.1.0"
---
# regexp/match-any

> enforce match any character style

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule enforces the regular expression notation to match any character.  
e.g. `[\s\S]`, `[^]`, `/./s` (dotAll) and more.

<eslint-code-block fix>

```js
/* eslint regexp/match-any: "error" */

/* ✓ GOOD */
var foo = /[\s\S]/;
var foo = /./s;

/* ✗ BAD */
var foo = /[\S\s]/;
var foo = /[^]/;
var foo = /[\d\D]/;
var foo = /[\w\W]/;
```

</eslint-code-block>

## :wrench: Options

```json
{
  "regexp/match-any": ["error", {
    "allows": ["[\\s\\S]", "dotAll"]
  }]
}
```

- `"allows"` ... An array of notations that any characters that are allowed.  
  `"[\\s\\S]"`, `"[\\S\\s]"`, `"[^]"` and `"dotAll"` can be set.

### `{ "allows": ["[^]"] }`

<eslint-code-block fix>

```js
/* eslint regexp/match-any: ["error", { "allows": ["[^]"] }] */

/* ✓ GOOD */
var foo = /[^]/;

/* ✗ BAD */
var foo = /[\s\S]/;
var foo = /[\S\s]/;
var foo = /./s;
var foo = /[\d\D]/;
var foo = /[\w\W]/;
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/match-any.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/match-any.ts)
