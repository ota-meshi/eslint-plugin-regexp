---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-empty-lookarounds-assertion"
description: "disallow empty lookahead assertion or empty lookbehind assertion"
since: "v0.1.0"
---
# regexp/no-empty-lookarounds-assertion

> disallow empty lookahead assertion or empty lookbehind assertion

- :gear: This rule is included in `"plugin:regexp/recommended"`.

## :book: Rule Details

This rule reports empty lookahead assertion or empty lookbehind assertion.

### What are _empty lookarounds_?

An empty lookaround is a lookaround for which at least one path in the lookaround expression contains only elements that do not consume characters and do not assert characters. This means that the lookaround expression will trivially accept any input string.

**Examples:**

-   `(?=)`: One of simplest empty lookarounds.
-   `(?=a*)`: It is possible for `a*` to not consume characters, therefore the lookahead is _empty_.
-   `(?=a|b*)`: Only one path has to not consume characters. Since it is possible for `b*` to not consume characters, the lookahead is _empty_.
-   `(?=a|$)`: This is **not** an empty lookaround. `$` does not _consume_ characters but it does _assert_ characters. Similarly, all other standard assertions (`\b`, `\B`, `^`) are also not empty.

### Why are empty lookarounds a problem?

Because empty lookarounds accept the empty string, they are essentially non-functional. They will always trivially reject/accept.

E.g. `(?=b?)\w` will match `a` just fine. `(?=b?)` will always trivially accept no matter the input string. The same also happens for negated lookarounds but they will trivially reject. E.g. `(?!b?)\w` won't match any input strings.

The only way to fix empty lookarounds is to either remove them or to rewrite the lookaround expression to be non-empty.

<eslint-code-block>

```js
/* eslint regexp/no-empty-lookarounds-assertion: "error" */

/* ✓ GOOD */
var foo = /x(?=y)/;
var foo = /x(?!y)/;
var foo = /(?<=y)x/;
var foo = /(?<!y)x/;

/* ✗ BAD */
var foo = /x(?=)/;
var foo = /x(?!)/;
var foo = /(?<=)x/;
var foo = /(?<!)x/;
var foo = /(?=b?)\w/;
var foo = /(?!b?)\w/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.1.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-empty-lookarounds-assertion.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-empty-lookarounds-assertion.ts)
