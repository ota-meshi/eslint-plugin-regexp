---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-regexp-exec"
description: "enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided"
since: "v0.3.0"
---
# regexp/prefer-regexp-exec

<!-- end auto-generated rule header -->

> enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided

`RegExp#exec` is faster than `String#match` and both work the same when not using the `/g` flag.

## :book: Rule Details

This rule is aimed at enforcing the more performant way of applying regular expressions on strings.

This rule inspired by [@typescript-eslint/prefer-regexp-exec rule](https://typescript-eslint.io/rules/prefer-regexp-exec/).

<eslint-code-block>

```js
/* eslint regexp/prefer-regexp-exec: "error" */

/* ✓ GOOD */
/thing/.exec('something');

'some things are just things'.match(/thing/g);

const text = 'something';
const search = /thing/;
search.exec(text);

/* ✗ BAD */
'something'.match(/thing/);

'some things are just things'.match(/thing/);

text.match(search);
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :books: Further reading

- [@typescript-eslint/prefer-regexp-exec](https://typescript-eslint.io/rules/prefer-regexp-exec/)

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.3.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-regexp-exec.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-regexp-exec.ts)
