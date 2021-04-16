---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-potentially-empty-backreference"
description: "disallow backreferences that reference a group that might not be matched"
---
# regexp/no-potentially-empty-backreference

> disallow backreferences that reference a group that might not be matched

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :book: Rule Details

If the referenced group of a backreference is not matched because some other
path leads to the backreference, the backreference will be replaced with the
empty string. The same will happen if the captured text of the referenced group
was reset before reaching the backreference.

This will handle backreferences which will always be replaced with the empty
string for the above reason. Use [regexp/no-useless-backreference] for that.

<eslint-code-block>

```js
/* eslint regexp/no-potentially-empty-backreference: "error" */

/* ✓ GOOD */
var foo = /(a+)b\1/;
var foo = /(a+)b|\1/;  // this will be done by regexp/no-useless-backreference


/* ✗ BAD */
var foo = /(a)?b\1/;
var foo = /((a)|c)+b\2/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/no-useless-backreference]

[regexp/no-useless-backreference]: ./no-useless-backreference.md

## :heart: Compatibility

This rule was taken from [eslint-plugin-clean-regex].  
This rule is compatible with [clean-regex/no-potentially-empty-backreference] rule.

[eslint-plugin-clean-regex]: https://github.com/RunDevelopment/eslint-plugin-clean-regex
[clean-regex/no-potentially-empty-backreference]: https://github.com/RunDevelopment/eslint-plugin-clean-regex/blob/master/docs/rules/no-potentially-empty-backreference.md

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-potentially-empty-backreference.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-potentially-empty-backreference.ts)
