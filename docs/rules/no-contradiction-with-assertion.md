---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-contradiction-with-assertion"
description: "disallow elements that contradict assertions"
since: "v1.2.0"
---
# regexp/no-contradiction-with-assertion

> disallow elements that contradict assertions

## :book: Rule Details

This rule reports elements that contradict an assertion. All elements reported by this rule fall into one of two categories:

1. An element/alternative that can never be entered.

    This means that the element is dead code and can be removed. Example:

    <eslint-code-block>

    ```js
    /* eslint regexp/no-contradiction-with-assertion: "error" */

    var foo = /(?=a)(\w|-)/;
    var foo = /(?=a)b*a/;
    ```

    </eslint-code-block>

2. An element that is always entered.

    Right now, only quantifiers with a minimum of 0 are reported in this category. They are contradictory because the minimum of 0 is changed by the assertion to be effectively 1. Example:

    <eslint-code-block>

    ```js
    /* eslint regexp/no-contradiction-with-assertion: "error" */

    var foo = /a\b-?a/;
    var foo = /^foo$[\s\S]*?^end foo/m;
    ```

    </eslint-code-block>

This rule is quite similar to [regexp/no-useless-assertions]. While [regexp/no-useless-assertions] tries to find assertions that contradict the pattern, this rule tries to find parts of the pattern that contradict assertions.


<eslint-code-block>

```js
/* eslint regexp/no-contradiction-with-assertion: "error" */

/* ✓ GOOD */
var foo = /a\b-a/;
var foo = /a\ba/; // handled by regexp/no-useless-assertions

/* ✗ BAD */
var foo = /a\b-?a/;
var foo = /a\b(a|-)/;
var foo = /a\ba*-/;
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :books: Further reading

- [regexp/no-useless-assertions]

[regexp/no-useless-assertions]: ./no-useless-assertions.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v1.2.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-contradiction-with-assertion.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-contradiction-with-assertion.ts)
