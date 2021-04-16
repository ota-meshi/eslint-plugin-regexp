---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-unused-global-flag"
description: "disallow unused global flag"
---
# regexp/no-unused-global-flag

> disallow unused global flag

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :book: Rule Details

This rule checks if a regular expression with the `g` flag is used in the global regular expression test.
If it is determined that the global flag is unnecessary, it will be reported.

<eslint-code-block>

```js
/* eslint regexp/no-unused-global-flag: "error" */

/* ✓ GOOD */
const regex1 = /foo/g;
const str = 'table football, foosball';
while ((array = regex1.exec(str)) !== null) {
  //
}

const regex2 = /foo/g;
regex2.test(string);
regex2.test(string);

str.replace(/foo/g, 'bar');
str.replaceAll(/foo/g, 'bar');

/* ✗ BAD */
/foo/g.test(string);
const regex3 = /foo/g;
regex3.test(string); // You have used it only once.

/foo/g.exec(string);
const regex4 = /foo/g;
regex4.exec(string); // You have used it only once.

new RegExp('foo', 'g').test(string);

str.search(/foo/g);
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-unused-global-flag.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-unused-global-flag.ts)
