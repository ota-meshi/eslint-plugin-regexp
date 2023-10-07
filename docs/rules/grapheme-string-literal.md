---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/grapheme-string-literal"
description: "enforce single grapheme in string literal"
since: "v2.0.0-next.13"
---
# regexp/grapheme-string-literal

<!-- end auto-generated rule header -->

> enforce single grapheme in string literal

## :book: Rule Details

This rule is aimed to clarify the difference between using a string literal and normal disjunctions by not using string literals for purposes other than expressing a single grapheme.

<eslint-code-block>

```js
/* eslint regexp/grapheme-string-literal: "error" */

/* ✓ GOOD */
var foo = /[\p{RGI_Emoji}--\q{🇦🇨|🇦🇩|🇦🇪|🇦🇫|🇦🇬|🇦🇮|🇦🇱|🇦🇲|🇦🇴|🇦🇶|🇦🇷|🇦🇸|🇦🇹|🇦🇺|🇦🇼|🇦🇽|🇦🇿|🇧🇦|🇧🇧|🇧🇩|🇧🇪|🇧🇫|🇧🇬|🇧🇭|🇧🇮|🇧🇯}]/v
var foo = /[\q{a|b|c}]/v

/* ✗ BAD */
var foo = /[\q{abc|def}]/v
```

</eslint-code-block>

This rule does not report empty string literals. Use [regexp/no-empty-string-literal] and [regexp/no-empty-alternative] if you want to check them.

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/no-empty-string-literal]
- [regexp/no-empty-alternative]
- [regexp/no-useless-string-literal]

[regexp/no-empty-string-literal]: ./no-empty-string-literal.md
[regexp/no-empty-alternative]: ./no-empty-alternative.md
[regexp/no-useless-string-literal]: ./no-useless-string-literal.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v2.0.0-next.13

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/grapheme-string-literal.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/grapheme-string-literal.ts)
