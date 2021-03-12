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

This rule reports unnecessary Non-capturing group

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-non-capturing-group: "error" */

/* ✓ GOOD */
var foo = /(?:abcd)?/
var foo = /(?:ab|cd)/

/* ✗ BAD */
var foo = /(?:abcd)/
var foo = /(?:[a-d])/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-non-capturing-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-non-capturing-group.ts)
