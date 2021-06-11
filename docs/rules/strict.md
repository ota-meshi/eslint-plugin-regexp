---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/strict"
description: "disallow not strictly valid regular expressions"
since: "v0.12.0"
---
# regexp/strict

> disallow not strictly valid regular expressions

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule disallows not strictly valid regular expressions.

An invalid pattern in a regular expression literal is a `SyntaxError` when the code is parsed. However, it is not always strictly checked.

Depending on the syntax defined in [Annex B] of the ECMAScript specification, some ambiguous pattern syntax may also succeed in parsing as a valid pattern. This rule reports these ambiguous patterns.

[Annex B]: https://tc39.es/ecma262/#sec-regular-expressions-patterns

<eslint-code-block fix>

```js
/* eslint regexp/strict: "error" */

/* ✓ GOOD */
var foo = /\}/
var foo = /\{/
var foo = /\]/
var foo = /\u{42}/u; // It matches "B".
var foo = /u{42}/; // It matches a string followed by 42 "u"s.

/* ✗ BAD */
var foo = /}/
var foo = /{/
var foo = /]/
var foo = /\u{42}/; // It matches a string followed by 42 "u"s.
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :books: Further reading

- [ECMAScript® 2022 Language Specification > Annex B > B.1.4 Regular Expressions Patterns](https://tc39.es/ecma262/#sec-regular-expressions-patterns)

## :couple: Related rules

- [no-invalid-regexp]
- [regexp/no-standalone-backslash]

[no-invalid-regexp]: https://eslint.org/docs/rules/no-invalid-regexp
[regexp/no-standalone-backslash]: ./no-standalone-backslash.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.12.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/strict.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/strict.ts)
