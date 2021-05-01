---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-empty-alternative"
description: "disallow alternatives without elements"
since: "v0.8.0"
---
# regexp/no-empty-alternative

> disallow alternatives without elements

## :book: Rule Details

While (re-)writing long regular expressions, it can happen that one forgets to
remove the `|` character of a former alternative. This rule tries to point out
these potential mistakes by reporting all empty alternatives.

<eslint-code-block>

```js
/* eslint regexp/no-empty-alternative: "error" */

/* ✓ GOOD */
var foo = /(?:)/
var foo = /a+|b*/

/* ✗ BAD */
var foo = /a+|b+|/
var foo = /\|\||\|||\|\|\|/
var foo = /a(?:a|bc|def|h||ij|k)/
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :heart: Compatibility

This rule was taken from [eslint-plugin-clean-regex].  
This rule is compatible with [clean-regex/no-empty-alternative] rule.

[eslint-plugin-clean-regex]: https://github.com/RunDevelopment/eslint-plugin-clean-regex
[clean-regex/no-empty-alternative]: https://github.com/RunDevelopment/eslint-plugin-clean-regex/blob/master/docs/rules/no-empty-alternative.md


## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.8.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-empty-alternative.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-empty-alternative.ts)
