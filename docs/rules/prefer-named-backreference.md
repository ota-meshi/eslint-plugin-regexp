---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-named-backreference"
description: "enforce using named backreferences"
---
# regexp/prefer-named-backreference

> enforce using named backreferences

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-named-backreference"
description: "enforce using named backreferences"
since: "v0.9.0"
---
# regexp/prefer-named-backreference

> enforce using named backreferences

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

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

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-named-backreference.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-named-backreference.ts)
