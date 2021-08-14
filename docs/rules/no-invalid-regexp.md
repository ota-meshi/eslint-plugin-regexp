---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-invalid-regexp"
description: "disallow invalid regular expression strings in `RegExp` constructors"
since: "v1.0.0"
---
# regexp/no-invalid-regexp

> disallow invalid regular expression strings in `RegExp` constructors

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

This rule reports invalid regular expression patterns given to `RegExp` constructors.

<eslint-code-block>

```js
/* eslint regexp/no-invalid-regexp: "error" */

/* ✓ GOOD */
RegExp('foo')
RegExp('[a' + ']')

/* ✗ BAD */
RegExp('\\')
RegExp('[a-Z]*')
RegExp('\\p{Foo}', 'u')

const space = '\\s*'
RegExp('=' + space + '+(\\w+)', 'u')
```

</eslint-code-block>

### Differences to ESLint's `no-invalid-regexp` rule

This rule is almost functionally equivalent to ESLint's [no-invalid-regexp] rule. The only difference is that this rule doesn't valid flags (see [no-non-standard-flag](./no-non-standard-flag.html)).

There are two reasons we provide this rule:

1. Better error reporting.

    Instead of reporting the whole invalid string, this rule will try to report the exact position of the syntax error.

2. Better support for complex constructor calls.

    ESLint's rule only validates `RegExp` constructors called with simple string literals. This rule also supports operations (e.g. string concatenation) and variables to some degree.

## :wrench: Options

Nothing.

## :books: Further reading

- [no-invalid-regexp]

[no-invalid-regexp]: https://eslint.org/docs/rules/no-invalid-regexp

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v1.0.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-invalid-regexp.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-invalid-regexp.ts)
