---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-named-capture-group"
description: "enforce using named capture groups"
---
# regexp/prefer-named-capture-group

> enforce using named capture groups

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :book: Rule Details

This rule reports capturing groups without a name.

This rule inspired by [prefer-named-capture-group] rule. The position of the report is improved over the core rule, and the argument of `new RegExp()` is also checked.

<eslint-code-block>

```js
/* eslint regexp/prefer-named-capture-group: "error" */

/* ✓ GOOD */
var foo = /(?<foo>ba+r)/;
var foo = /\b(?:foo)+\b/;

/* ✗ BAD */
var foo = /\b(foo)+\b/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :books: Further reading

- [prefer-named-capture-group]

[prefer-named-capture-group]: https://eslint.org/docs/rules/prefer-named-capture-group

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-named-capture-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-named-capture-group.ts)
