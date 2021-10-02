---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-named-capture-group"
description: "enforce using named capture groups"
since: "v1.2.0"
---
# regexp/prefer-named-capture-group

> enforce using named capture groups

## :book: Rule Details

This rule reports capturing groups without a name.

This rule is inspired by the [prefer-named-capture-group] rule. The positions of reports are improved over the core rule and arguments of `new RegExp()` are also checked.

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

## :couple: Related rules

- [regexp/prefer-named-backreference]
- [regexp/prefer-named-replacement]
- [regexp/prefer-result-array-groups]

[regexp/prefer-named-backreference]: ./prefer-named-backreference.md
[regexp/prefer-named-replacement]: ./prefer-named-replacement.md
[regexp/prefer-result-array-groups]: ./prefer-result-array-groups.md

## :books: Further reading

- [prefer-named-capture-group]

[prefer-named-capture-group]: https://eslint.org/docs/rules/prefer-named-capture-group

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v1.2.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-named-capture-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-named-capture-group.ts)
