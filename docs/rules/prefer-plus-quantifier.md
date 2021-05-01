---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-plus-quantifier"
description: "enforce using `+` quantifier"
---
# regexp/prefer-plus-quantifier

> enforce using `+` quantifier

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-plus-quantifier"
description: "enforce using `+` quantifier"
since: "v0.1.0"
---
# regexp/prefer-plus-quantifier

> enforce using `+` quantifier

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule is aimed at using `+` quantifier instead of `{1,}` in regular expressions.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-plus-quantifier: "error" */

/* ✓ GOOD */
var foo = /a+/;

/* ✗ BAD */
var foo = /a{1,}/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-plus-quantifier.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-plus-quantifier.ts)
