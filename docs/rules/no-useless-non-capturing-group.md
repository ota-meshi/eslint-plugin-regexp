---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-non-capturing-group"
description: "disallow unnecessary Non-capturing group"
since: "v0.4.0"
---
# regexp/no-useless-non-capturing-group

> disallow unnecessary Non-capturing group

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports unnecessary non-capturing group

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-non-capturing-group: "error" */

/* ✓ GOOD */
var foo = /(?:abcd)?/
var foo = /a(?:ab|cd)/

/* ✗ BAD */
var foo = /(?:ab|cd)/
var foo = /(?:abcd)/
var foo = /(?:[a-d])/
var foo = /(?:[a-d])|e/
var foo = /(?:a|(?:b|c)|d)/
```

</eslint-code-block>

## :wrench: Options

```json5
{
  "regexp/no-useless-non-capturing-group": ["error", {
    "allowTop": true
  }]
}
```

- `"allowTop"`:
  Whether a top-level non-capturing group is allowed. Defaults to `false`.

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-non-capturing-group: ["error", { allowTop: true }] */

/* ✓ GOOD */
var foo = /(?:abcd)/
var foo = /(?:ab|cd)/
var foo = /(?:abcd)/
var foo = /(?:[a-d])/

/* ✗ BAD */
var foo = /(?:[a-d])|e/
var foo = /(?:a|(?:b|c)|d)/
```

</eslint-code-block>

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-non-capturing-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-non-capturing-group.ts)
