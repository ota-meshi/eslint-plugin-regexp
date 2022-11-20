---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-lookaround-assertions"
description: "disallow useless nested lookaround assertions"
---
# regexp/no-useless-lookaround-assertions

> disallow useless nested lookaround assertions

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

The last positive lookahead assertion within a lookahead assertion is the same without the assertion.

```js
/Foo(?=Ba(?=r))/u; /* -> */ /Foo(?=Bar)/u;
```

Also, The first positive lookbehind assertion within a lookbehind assertion is the same without the assertion.

```js
/(?<=(?<=F)oo)Bar/u; /* -> */ /(?<=Foo)Bar/u;
```

This rule aims to report and fix these useless lookaround assertions.

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-lookaround-assertions: "error" */

/* ✓ GOOD */
var s = 'JavaScript'.replace(/Java(?=Script)/u, 'Type');
var s = 'JavaScript'.replace(/(?<=Java)Script/u, '');

/* ✗ BAD */
var s = 'JavaScript'.replace(/Java(?=Scrip(?=t))/u, 'Type')
var s = 'JavaScript'.replace(/(?<=(?<=J)ava)Script/u, '')
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-lookaround-assertions.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-lookaround-assertions.ts)
