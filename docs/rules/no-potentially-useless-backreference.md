---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-potentially-useless-backreference"
description: "disallow backreferences that reference a group that might not be matched"
since: "v0.9.0"
---
# regexp/no-potentially-useless-backreference

⚠️ This rule _warns_ in the ✅ `plugin:regexp/recommended` config.

<!-- end auto-generated rule header -->

> disallow backreferences that reference a group that might not be matched

## :book: Rule Details

If the referenced group of a backreference is not matched because some other path leads to the backreference, the backreference will trivially accept (e.g. `/(?:(a)|b)\1/`). The same will happen if the captured text of the referenced group was reset before reaching the backreference.

This will not handle backreferences that always trivially accept. Use [regexp/no-useless-backreference] for that.

<eslint-code-block>

```js
/* eslint regexp/no-potentially-useless-backreference: "error" */

/* ✓ GOOD */
var foo = /(a+)b\1/;
var foo = /(a+)b|\1/;  // this will be done by regexp/no-useless-backreference


/* ✗ BAD */
var foo = /(?:(a)|b)\1/;
var foo = /(a)?b\1/;
var foo = /((a)|c)+b\2/;
```

</eslint-code-block>

### Possible fixes

_Note:_ Since this rule finds potential programming errors, there are no automatic fixes and suggestions. Fixing reports will always involve manually changing the regex. However, it is important to note that this rule reports _potential_ errors. If you are confident that a regex is correct, feel free to disable this rule for that regex.

One common pattern this rule reports is `/(a)?b\1/`. This typically happens when searching for optionally quoted text. While it is possible to move the `?` inside the capturing group, it is often better to explicitly factor out the `b` path: `/(a)b\1|b/`. Since quoted and unquoted text typically have slightly different syntax, this form encourages using the correct syntax for each case, resulting in more correct regexes.

Other patterns reported by this rule can typically also be fixed by factoring out the capturing group + backreference.

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/no-useless-backreference]

[regexp/no-useless-backreference]: ./no-useless-backreference.md

## :heart: Compatibility

This rule was taken from [eslint-plugin-clean-regex].\
This rule is compatible with [clean-regex/no-potentially-empty-backreference] rule.

[eslint-plugin-clean-regex]: https://github.com/RunDevelopment/eslint-plugin-clean-regex
[clean-regex/no-potentially-empty-backreference]: https://github.com/RunDevelopment/eslint-plugin-clean-regex/blob/master/docs/rules/no-potentially-empty-backreference.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-potentially-useless-backreference.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-potentially-useless-backreference.ts)
