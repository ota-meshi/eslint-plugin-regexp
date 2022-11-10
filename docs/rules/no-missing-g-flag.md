---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-missing-g-flag"
description: "disallow missing `g` flag in patterns used in `String#matchAll` and `String#replaceAll`"
since: "v1.10.0"
---
# regexp/no-missing-g-flag

> disallow missing `g` flag in patterns used in `String#matchAll` and `String#replaceAll`

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

When calling [`String#matchAll()`] and [`String#replaceAll()`] with a `RegExp` missing the global (`g`) flag, it will be a runtime error.
This rule reports `RegExp`s missing the global (`g`) flag that cause these errors.

<eslint-code-block fix>

```js
/* eslint regexp/no-missing-g-flag: "error" */
const games = 'table football, foosball'
const text = 'The quick brown fox jumps over the lazy dog. If the dog reacted, was it really lazy?';

/* ✓ GOOD */
var m = games.matchAll(/foo/g);
var newText = text.replaceAll(/Dog/ig, 'cat');


/* ✗ BAD */
var m = games.matchAll(/foo/);
var newText = text.replaceAll(/Dog/i, 'cat');

```

</eslint-code-block>

## :wrench: Options

```json
{
  "regexp/no-missing-g-flag": ["error",
    {
      "strictTypes": true
    }
  ]
}
```

- `strictTypes` ... If `true`, strictly check the type of object to determine if the regex instance was used in `matchAll()` and `replaceAll()`. Default is `true`.  
  This option is always on when using TypeScript.

## :books: Further reading

- [MDN Web Docs - String.prototype.matchAll()][`String#matchAll()`]
- [MDN Web Docs - String.prototype.replaceAll()][`String#replaceAll()`]

[`String#matchAll()`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll
[`String#replaceAll()`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v1.10.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-missing-g-flag.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-missing-g-flag.ts)
