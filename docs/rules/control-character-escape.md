---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/control-character-escape"
description: "enforce consistent escaping of control characters"
since: "v0.9.0"
---
# regexp/control-character-escape

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> enforce consistent escaping of control characters

## :book: Rule Details

This rule reports control characters that were not escaped using a control escape (`\0`, `t`, `\n`, `\v`, `f`, `\r`).

<eslint-code-block fix>

<!-- markdownlint-disable no-hard-tabs -->

```js
/* eslint regexp/control-character-escape: "error" */

/* ✓ GOOD */
var foo = /[\n\r]/;
var foo = /\t/;
var foo = RegExp("\t+\n");

/* ✗ BAD */
var foo = /	/;
var foo = /\u0009/;
var foo = /\u{a}/u;
var foo = RegExp("\\u000a");
```

<!-- markdownlint-enable no-hard-tabs -->

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/control-character-escape.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/control-character-escape.ts)
