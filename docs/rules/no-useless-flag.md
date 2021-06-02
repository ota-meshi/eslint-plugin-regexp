---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-flag"
description: "disallow unnecessary regex flags"
since: "v0.9.0"
---
# regexp/no-useless-flag

> disallow unnecessary regex flags

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This will point out present regex flags that do not change the pattern.

### `i` flag (ignoreCase)

The `i` flag is only necessary if the pattern contains any characters with case
variations. If the pattern contains no such characters, the flag will be
unnecessary. E.g. `/\.{3}/i`

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-flag: "error" */

/* ✓ GOOD */
var foo = /a|b/i;

/* ✗ BAD */
var foo = /\.{3}/i;
var foo = /\w+/i;
```

</eslint-code-block>

### `m` flag (multiline)

The `m` flag changes the behavior of the `^` and `$` assertions. If the pattern
doesn't contain these anchors, the `m` flag will be unnecessary. E.g. `/foo|[^\r\n]*/m`

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-flag: "error" */

/* ✓ GOOD */
var foo = /^foo$/m;

/* ✗ BAD */
var foo = /foo|[^\r\n]*/m;
var foo = /a|b/m;
```

</eslint-code-block>

### `s` flag (dotAll)

The `s` flag makes the dot (`.`) match all characters instead of the usually
non-line-terminator characters. If the pattern doesn't contain a dot
character set, the `s` flag will be unnecessary. E.g. `/[.:]/s`

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-flag: "error" */

/* ✓ GOOD */
var foo = /a.*?b/s;

/* ✗ BAD */
var foo = /[.:]/s;
var foo = /^foo$/s;
```

</eslint-code-block>

### `g` flag (global)

The `g` flag is used when you need to test a regular expression against all possible string match. If not, it will be unnecessary.

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-flag: "error" */

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

### `y` flag (sticky)

The `y` flag is used when you need to do a sticky search. If not, it will be unnecessary.

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-flag: "error" */

/* ✓ GOOD */
const regex1 = /foo/y;
const str = 'table football, foosball';
regex1.lastIndex = 6
var array = regex1.exec(str)

const regex2 = /foo/y;
regex2.test(string);
regex2.test(string);

str.replace(/foo/y, 'bar');
str.replaceAll(/foo/gy, 'bar');

const regexp3 = /foo/y
str.search(regexp3)

/* ✗ BAD */
str.split(/foo/y);
```

</eslint-code-block>

### other flags

No other flags will be checked.

## :wrench: Options

```json5
{
  "regexp/no-useless-flag": ["error",
    {
      "ignore": [] // An array of "i", "m", "s", "g" and "y".
    }
  ]
}
```

- `ignore` ... An array of flags to ignore from the check.

### `"ignore": ["s", "g"]`

<eslint-code-block fix>

```js
/* eslint regexp/no-useless-flag: ["error", { "ignore": ["s", "g"] }] */

/* ✓ GOOD */
var foo = /\w/s;
/foo/g.test(string);

/* ✗ BAD */
var foo = /\w/i;
var foo = /\w/m;
```

</eslint-code-block>

## :heart: Compatibility

This rule is compatible with [clean-regex/no-unnecessary-flag] rule.

[clean-regex/no-unnecessary-flag]: https://github.com/RunDevelopment/eslint-plugin-clean-regex/blob/master/docs/rules/no-unnecessary-flag.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.9.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-flag.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-flag.ts)
