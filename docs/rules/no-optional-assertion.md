---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-optional-assertion"
description: "disallow optional assertions"
since: "v0.9.0"
---
# regexp/no-optional-assertion

> disallow optional assertions

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

Assertions that are quantified (directly or indirectly) can be considered optional if the quantifier has a minimum of zero.

A simple example is the following pattern: `/a(?:$)*b/`. The `$` assertion will reject but if that happens, it will simply be ignored because of the `*` quantifier. The assertion is optional, serving no function whatsoever.

More generally, an assertion is optional, if there exists a parent quantifier with a minimum of zero such that all possible paths of the quantified element that contain the assertion do not consume characters.

Here's an example: `a(?:foo|(?<!-)(?:-|\b))*b`. The `\b` is optional. However, the lookbehind `(?<!-)` is not optional because the group `(?:-|\b)` right after it can consume a character.

Optional assertions don't affect the pattern in any way. They are essentially dead code.

<eslint-code-block>

```js
/* eslint regexp/no-optional-assertion: "error" */

/* ✓ GOOD */
var foo = /\w+(?::|\b)/;

/* ✗ BAD */
var foo = /a(?:$)*b/;
var foo = /a(?:foo|(?<!-)(?:-|\b))*b/; // The `\b` is optional.
var foo = /(?:^)?\w+/;   // warns about `^`
var foo = /\w+(?::|$)?/; // warns about `$`
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :heart: Compatibility

This rule was taken from [eslint-plugin-clean-regex].  
This rule is compatible with [clean-regex/no-optional-assertion] rule.

[eslint-plugin-clean-regex]: https://github.com/RunDevelopment/eslint-plugin-clean-regex
[clean-regex/no-optional-assertion]: https://github.com/RunDevelopment/eslint-plugin-clean-regex/blob/master/docs/rules/no-optional-assertion.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-optional-assertion.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-optional-assertion.ts)
