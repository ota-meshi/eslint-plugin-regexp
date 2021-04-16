---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-optional-assertion"
description: "disallow optional assertions"
---
# regexp/no-optional-assertion

> disallow optional assertions

- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>

## :book: Rule Details

Assertions that as quantified in some way can be considered optional, if the
quantifier as a minimum of zero.

A simple example is the following pattern: `/a(?:$)*b/`. The end-of-string
assertion will obviously reject but if that happens, it will simply be ignored
because of the quantifier. The assertion is essentially optional, serving no
function whatsoever.

More generally, an assertion is optional, if the concatenation of all possible
paths that start at the start of a zero-quantified element, end at the end of
that element, and contain the assertion does not consume characters.

Here's an example of that: `a(?:foo|(?<!-)(?:-|\b))*b`. The `\b` is optional.
The lookbehind is not optional because following group can consume a character.

The presence of optional assertions don't change the meaning of the pattern, so
they are dead code.

<eslint-code-block>

```js
/* eslint regexp/no-optional-assertion: "error" */

/* ✓ GOOD */
var foo = /\w+(?::|\b)/;

/* ✗ BAD */
var foo = /a(?:$)*b/;
var foo = /a(?:foo|(?<!-)(?:-|\b))*b/; // The `\b` is optional.
var foo = /(?:^)?\w+/;   // warns about `^`
var foo = /\w+(?::|$)?/; // warns about `$`
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-optional-assertion.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-optional-assertion.ts)
