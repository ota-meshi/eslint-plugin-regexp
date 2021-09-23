---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/require-unicode-regexp"
description: "enforce the use of the `u` flag"
since: "v1.2.0"
---
# regexp/require-unicode-regexp

> enforce the use of the `u` flag

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports regular expressions without the `u` flag.

It will automatically add the `u` flag to regular expression where it is statically guaranteed to be safe to do so. In all other cases, the developer has to check that adding the `u` flag doesn't cause the regex to behave incorrectly.

This rule is inspired by the [require-unicode-regexp] rule. The position of the report is improved over the core rule and arguments of `new RegExp()` are also checked.

<eslint-code-block fix>

```js
/* eslint regexp/require-unicode-regexp: "error" */

/* ✓ GOOD */
var foo = /foo/u;
var foo = /a\s+b/u;

/* ✗ BAD */
var foo = /foo/;
var foo = RegExp("a\\s+b");
var foo = /[a-z]/i;
var foo = /\S/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :books: Further reading

- [require-unicode-regexp]

[require-unicode-regexp]: https://eslint.org/docs/rules/require-unicode-regexp

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v1.2.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/require-unicode-regexp.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/require-unicode-regexp.ts)
