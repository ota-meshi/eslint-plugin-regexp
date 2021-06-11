---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-assertions"
description: "disallow assertions that are known to always accept (or reject)"
since: "v0.9.0"
---
# regexp/no-useless-assertions

> disallow assertions that are known to always accept (or reject)

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

Some assertion are unnecessary because the rest of the pattern forces them to
always be accept (or reject).

<eslint-code-block>

```js
/* eslint regexp/no-useless-assertions: "error" */

/* ✓ GOOD */
var foo = /\bfoo\b/;

/* ✗ BAD */
var foo = /#\bfoo/;    // \b will always accept
var foo = /foo\bbar/;  // \b will always reject
var foo = /$foo/;      // $ will always reject
var foo = /(?=\w)\d+/; // (?=\w) will always accept
```

</eslint-code-block>

### Limitations

Right now, this rule is implemented by only looking a single character ahead and
behind. This is enough to determine whether the builtin assertions (`\b`, `\B`,
`^`, `$`) trivially reject or accept but it is not enough for all lookarounds.
The algorithm determining the characters ahead and behind is very conservative
which can lead to false negatives.

## :wrench: Options

Nothing.

## :heart: Compatibility

This rule was taken from [eslint-plugin-clean-regex].  
This rule is compatible with [clean-regex/no-unnecessary-assertions] rule.

[eslint-plugin-clean-regex]: https://github.com/RunDevelopment/eslint-plugin-clean-regex
[clean-regex/no-unnecessary-assertions]: https://github.com/RunDevelopment/eslint-plugin-clean-regex/blob/master/docs/rules/no-unnecessary-assertions.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-assertions.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-assertions.ts)
