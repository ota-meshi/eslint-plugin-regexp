---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-dupe-disjunctions"
description: "disallow duplicate disjunctions"
---
# regexp/no-dupe-disjunctions

> disallow duplicate disjunctions

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-dupe-disjunctions"
description: "disallow duplicate disjunctions"
since: "v0.4.0"
---
# regexp/no-dupe-disjunctions

> disallow duplicate disjunctions

## :book: Rule Details

This rule disallows duplicate disjunctions.

<eslint-code-block>

```js
/* eslint regexp/no-dupe-disjunctions: "error" */

/* ✓ GOOD */
var foo = /a|b/
var foo = /(a|b)/
var foo = /(?:a|b)/

/* ✗ BAD */
var foo = /a|a/
var foo = /(a|a)/
var foo = /(?:a|a)/
var foo = /abc|abc/
var foo = /[ab]|[ba]/
```

</eslint-code-block>

## :wrench: Options

```json5
{
  "regexp/no-dupe-disjunctions": [
    "error",
    {
        "disallowNeverMatch": false
    }
  ]
}
```

- `disallowNeverMatch` ... If `true`, it reports a pattern that does not match as a result of a partial duplication of the previous pattern.

### `"disallowNeverMatch": true`

<eslint-code-block>

```js
/* eslint regexp/no-dupe-disjunctions: ["error", { "disallowNeverMatch": true }] */

/* ✓ GOOD */
var foo = /a|b/
var foo = /(a|b)/
var foo = /(?:a|b)/

/* ✗ BAD */

// Duplication
var foo = /a|a/

// A string that matches the pattern on the right also matches the pattern on the left, so it doesn't make sense to process the pattern on the right.
var foo = /a|abc/
var foo = /.|abc/
var foo = /.|a|b|c/
```

</eslint-code-block>

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-dupe-disjunctions.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-dupe-disjunctions.ts)
