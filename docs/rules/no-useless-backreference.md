---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-backreference"
description: "disallow useless backreferences in regular expressions"
since: "v0.1.0"
---
# regexp/no-useless-backreference

> disallow useless backreferences in regular expressions

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

Backreferences that will always trivially accept serve no function and can be removed.

This rule is a based on the ESLint core [no-useless-backreference] rule. It reports all the ESLint core rule reports and some more.

### Causes

Backreferences can be useless for multiple reasons.

#### Empty capturing groups

The is the easiest reason. The references capturing group does not consume any characters (e.g. `/(\b)a\1/`). Since the capturing group can only capture the empty string, the backreference is guaranteed to accept any input.

#### Nested backreferences

If a backreference is inside the group it references (e.g. `/(a\1)/`), then it is guaranteed to trivially accept.

This is because the regex engine only sets the text of a capturing group **after** the group has been matched. Since the regex engine is still in the process of matching the group, its capture text is undefined.

#### Different alternatives

If a backreference and its referenced capturing group are in different alternatives (e.g. `/(a)|\1/`), then the backreference will always trivially accept because the captured text of the referenced group is undefined.

#### Forward references and backward references

Backreferences are supposed to be matched **after** their referenced capturing group. Since regular expressions are matched from left to right, backreferences usually appear to the right of to their referenced capturing groups (e.g. `/(a)\1/`). However, backreferences can also be placed before (to the left of) their referenced capturing group (e.g. `/\1(a)/`). These backreferences are to trivially accept because the captured text of their referenced groups is undefined. We call these backreferences _forward references_.

Inside **lookbehind assertions**, regular expressions are matched from right to left and not from left to right. This means that only backreferences now have to appear to the left of their respective capturing group to be matched after them (e.g. `/(?<=\1(a))/`). Backreferences placed to before (to the right of) their referenced capturing group inside lookbehinds are guaranteed to trivially accept. We call these backreferences _backward references_.

#### Negated lookaround assertions

If the referenced capturing group of a backreference is inside a negated lookaround assertion the backreference is also part of, then the backreference will be guaranteed to trivially accept.

To understand why this is the case, let's look at the example `/(?!(a))\w\1/y`.

1. Let's assume the input string is `ab`. <br>
   Since `(a)` accepts the character `a`, `(?!(a))` will reject. So the input is reject before the backreference `\1` can be reached.

   The result of `/(?!(a))\w\1/y.exec("ab")` is `null`.
2. Let's assume the input string is `bc`. <br>
   Since `(a)` rejects the character `b`, its captured text will be undefined and `(?!(a))` will accept. Then `\w` will accept and consume the character `b`. Since the captured text of `(a)` is undefined, the backreference `\1` will trivially accept without consuming characters.

   The result of `/(?!(a))\w\1/y.exec("bc")` is `[ 'b', undefined, index: 0, input: 'bc' ]`.

Note that this is only a problem if the backreference is not part of the negated lookaround assertion. I.e. `/(?!(a)\1)\w/` is okay.

<eslint-code-block>

```js
/* eslint regexp/no-useless-backreference: "error" */

/* ✓ GOOD */
var foo = /(a)b\1/;
var foo = /(a?)b\1/;
var foo = /(\b|a)+b\1/;
var foo = /(a)?(?:a|\1)/;

/* ✗ BAD */
var foo = /\1(a)/;
var foo = /(a\1)/;
var foo = /(a)|\1/;
var foo = /(?:(a)|\1)+/;
var foo = /(?<=(a)\1)/;
var foo = /(\b)a\1/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :books: Further reading

- [no-useless-backreference]

[no-useless-backreference]: https://eslint.org/docs/rules/no-useless-backreference

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-backreference.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-backreference.ts)
