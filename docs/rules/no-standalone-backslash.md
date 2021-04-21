---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-standalone-backslash"
description: "disallow standalone backslash (`\\`)"
---
# regexp/no-standalone-backslash

> disallow standalone backslash (`\`)

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :book: Rule Details

This rule disallows backslash (`\`) without escape.

E.g. the regular expression `/\c/` without the unicode (`u`) flag is the same pattern as `/\\c/`.

In most cases, standalone backslashes are used by accident when a control escape sequence (`\cX`) or another escape sequence was intended. They are very confusing and should not be used intentionally.

This behavior is described in [Annex B] of the ECMAScript specification.

[Annex B]: https://tc39.es/ecma262/#sec-regular-expressions-patterns

<eslint-code-block>

```js
/* eslint regexp/no-standalone-backslash: "error" */

/* ✓ GOOD */
var foo = /\cX/;

/* ✗ BAD */
var foo = /\c/;
var foo = /\c-/;
var foo = /[\c]/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/no-useless-escape](./no-useless-escape.md)

## :books: Further reading

- [ECMAScript® 2022 Language Specification > Annex B > B.1.4 Regular Expressions Patterns](https://tc39.es/ecma262/#sec-regular-expressions-patterns)

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-standalone-backslash.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-standalone-backslash.ts)
