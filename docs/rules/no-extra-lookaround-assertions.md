---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-extra-lookaround-assertions"
description: "disallow unnecessary nested lookaround assertions"
since: "v1.11.0"
---
# regexp/no-extra-lookaround-assertions

💼 This rule is enabled in the ✅ `plugin:regexp/recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

> disallow unnecessary nested lookaround assertions

## :book: Rule Details

The last positive lookahead assertion within a lookahead assertion is the same without lookahead assertions.
Also, The first positive lookbehind assertion within a lookbehind assertion is the same without lookbehind assertions.
They can be inlined or converted to group.

```js
/a(?=b(?=c))/u; /* -> */ /a(?=bc)/u;
/a(?=b(?=c|C))/u; /* -> */ /a(?=b(?:c|C))/u;

/(?<=(?<=a)b)c/u; /* -> */ /(?<=ab)c/u;
/(?<=(?<=a|A)b)c/u; /* -> */ /(?<=(?:a|A)b)c/u;
```

This rule aims to report and fix these unnecessary lookaround assertions.

<eslint-code-block fix>

```js
/* eslint regexp/no-extra-lookaround-assertions: "error" */

/* ✓ GOOD */
var ts = 'JavaScript'.replace(/Java(?=Script)/u, 'Type');
var java = 'JavaScript'.replace(/(?<=Java)Script/u, '');
var re1 = /a(?=bc)/u;
var re2 = /a(?=b(?:c|C))/u;
var re3 = /(?<=ab)c/u;
var re4 = /(?<=(?:a|A)b)c/u;

/* ✗ BAD */
var ts = 'JavaScript'.replace(/Java(?=Scrip(?=t))/u, 'Type');
var java = 'JavaScript'.replace(/(?<=(?<=J)ava)Script/u, '');
var re1 = /a(?=b(?=c))/u;
var re2 = /a(?=b(?=c|C))/u;
var re3 = /(?<=(?<=a)b)c/u;
var re4 = /(?<=(?<=a|A)b)c/u;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v1.11.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-extra-lookaround-assertions.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-extra-lookaround-assertions.ts)
