---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-named-backreference"
description: "enforce using named backreferences"
since: "v0.9.0"
---
# regexp/prefer-named-backreference

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> enforce using named backreferences

## :book: Rule Details

This rule reports and fixes backreferences that do not use the name of their referenced capturing group.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-named-backreference: "error" */

/* ✓ GOOD */
var foo = /(a)\1/
var foo = /(?<foo>a)\k<foo>/

/* ✗ BAD */
var foo = /(?<foo>a)\1/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/prefer-named-capture-group]
- [regexp/prefer-named-replacement]
- [regexp/prefer-result-array-groups]

[regexp/prefer-named-capture-group]: ./prefer-named-capture-group.md
[regexp/prefer-named-replacement]: ./prefer-named-replacement.md
[regexp/prefer-result-array-groups]: ./prefer-result-array-groups.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-named-backreference.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-named-backreference.ts)
