---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-dupe-characters-character-class"
description: "disallow duplicate characters in the RegExp character class"
since: "v0.1.0"
---
# regexp/no-dupe-characters-character-class

> disallow duplicate characters in the RegExp character class

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

Because multiple same character classes in regular expressions only one is useful, they might be typing mistakes.

```js
var foo = /\\(\\)/;
```

## :book: Rule Details

This rule disallows duplicate characters in the RegExp character class.

<eslint-code-block fix>

```js
/* eslint regexp/no-dupe-characters-character-class: "error" */

/* ✓ GOOD */
var foo = /[\(\)]/;

var foo = /[a-z\s]/;

var foo = /[\w]/;

/* ✗ BAD */
var foo = /[\\(\\)]/;
//          ^^ ^^        "\\" are duplicated
var foo = /[a-z\\s]/;
//          ^^^  ^       "s" are duplicated
var foo = /[\w0-9]/;
//          ^^^^^        "0-9" are duplicated
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-dupe-characters-character-class.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-dupe-characters-character-class.ts)
