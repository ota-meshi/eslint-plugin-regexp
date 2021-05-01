---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-predefined-assertion"
description: "prefer predefined assertion over equivalent lookarounds"
---
# regexp/prefer-predefined-assertion

> prefer predefined assertion over equivalent lookarounds

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-predefined-assertion"
description: "prefer predefined assertion over equivalent lookarounds"
---
# regexp/prefer-predefined-assertion

> prefer predefined assertion over equivalent lookarounds

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

All predefined assertions (`\b`, `\B`, `^`, and `$`) can be expressed as lookaheads and lookbehinds. E.g. `/a$/` is the same as `/a(?![^])/`.

In most cases, it's better to use the predefined assertions because they are better known.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-predefined-assertion: "error" */

/* ✓ GOOD */
var foo = /a(?=\W)/;

/* ✗ BAD */
var foo = /a(?![^])/;
var foo = /a(?!\w)/;
var foo = /a+(?!\w)(?:\s|bc+)+/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-predefined-assertion.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-predefined-assertion.ts)
