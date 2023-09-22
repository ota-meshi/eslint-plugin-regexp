---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/require-unicode-sets-regexp"
description: "enforce the use of the `v` flag"
since: "v2.0.0-next.7"
---
# regexp/require-unicode-sets-regexp

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> enforce the use of the `v` flag

## :book: Rule Details

This rule reports regular expressions without the `v` flag.

It will automatically replace the `v` flag to regular expressions where it is already uses the 'u' flag and statically guaranteed to be safe to do so. In all other cases, the developer has to check that adding the `v` flag doesn't cause the regex to behave incorrectly.

If you want to automatically add the `v` flag to legacy regular expressions that don't use the `u` flag, use them together with the [regexp/require-unicode-regexp] rule.

<eslint-code-block fix>

```js
/* eslint regexp/require-unicode-sets-regexp: "error" */

/* ✓ GOOD */
var foo = /foo/v;
var foo = /a\s+b/v;

/* ✗ BAD */
var foo = /foo/;
var foo = RegExp("a\\s+b");
var foo = /[a-z]/i;
var foo = /\S/;
var foo = /foo/u;
var foo = RegExp("a\\s+b", 'u');
var foo = /[a-z]/iu;
var foo = /\S/u;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/require-unicode-regexp]

[regexp/require-unicode-regexp]: ./require-unicode-regexp.md

## :books: Further reading

- [require-unicode-regexp]

[require-unicode-regexp]: https://eslint.org/docs/rules/require-unicode-regexp

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v2.0.0-next.7

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/require-unicode-sets-regexp.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/require-unicode-sets-regexp.ts)
