---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-escape-replacement-dollar-char"
description: "enforces escape of replacement `$` character (`$$`)."
---
# regexp/prefer-escape-replacement-dollar-char

> enforces escape of replacement `$` character (`$$`).

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :book: Rule Details

This rule aims to enforce escape when using the `$` character in replacement pattern of string replacement.

<eslint-code-block>

```js
/* eslint regexp/prefer-escape-replacement-dollar-char: "error" */

/* ✓ GOOD */
'€1,234'.replace(/€/, '$$'); // "$1,234"


/* ✗ BAD */
'€1,234'.replace(/€/, '$'); // "$1,234"
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/no-useless-dollar-replacements](./no-useless-dollar-replacements.md)

## :books: Further reading

- [MDN Web Docs - String.prototype.replace() > Specifying a string as a parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_a_parameter)

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-escape-replacement-dollar-char.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-escape-replacement-dollar-char.ts)
