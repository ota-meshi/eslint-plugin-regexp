---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-standalone-reverse-solidus"
description: "disallow standalone reverse solidus (`\\`)"
---
# regexp/no-standalone-reverse-solidus

> disallow standalone reverse solidus (`\`)

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :book: Rule Details

This rule disallows reverse solidus (`\`) without escape.

The regular expression `/\c/` without the unicode (`u`) flag has the same pattern as `/\\c/`.

This is the specification described in [Annex B] of ECMAScript. But very confusing and you should not use it intentionally.
In most cases you intended the control escape sequence (`\cX`) or another escape, but you maybe made a mistake.

[Annex B]: https://tc39.es/ecma262/#sec-regular-expressions-patterns

<eslint-code-block>

```js
/* eslint regexp/no-standalone-reverse-solidus: "error" */

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

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-standalone-reverse-solidus.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-standalone-reverse-solidus.ts)
