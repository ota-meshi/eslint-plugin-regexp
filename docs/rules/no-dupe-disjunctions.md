---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-dupe-disjunctions"
description: "disallow duplicate disjunctions"
since: "v0.4.0"
---
# regexp/no-dupe-disjunctions

> disallow duplicate disjunctions

## :book: Rule Details

This rule disallows duplicate disjunctions.

<eslint-code-block>

```js
/* eslint regexp/no-dupe-disjunctions: "error" */

/* ✓ GOOD */
var foo = /a|b/
var foo = /(a|b)/
var foo = /(?:a|b)/

/* ✗ BAD */
var foo = /a|a/
var foo = /(a|a)/
var foo = /(?:a|a)/
var foo = /abc|abc/
var foo = /[ab]|[ba]/
var foo = /a|abc/
var foo = /.|abc/
var foo = /.|a|b|c/
```

</eslint-code-block>

## :wrench: Options

```json5
{
  "regexp/no-dupe-disjunctions": [
    "error",
    {
        "report": "trivial",
        "alwaysReportExponentialBacktracking": true
    }
  ]
}
```

### `report`

This option control what types of duplications will be reported. The possible values are:

- `report: "trivial"` (_default_)

  With this option, only trivial cases will be reported. This means that the reported alternative can be removed without affecting the pattern.

  Trivial cases include duplicates (e.g. `a|a`) and subsets (e.g. `\w|a`).

- `report: "interesting"`

  All trivial cases and superset cases will be reported.

  In superset cases, an alternative _might_ be removable. Whether a reported alternative is removable cannot trivially be decided and depends on the pattern.

  E.g. `Foo|\w+` is a superset case because `\w+` is a superset of `Foo`. In the regex `/\b(?:Foo|\w+)\b/`, the `Foo` alternative can be removed. However in the regex `/Foo|\w+/`, the `Foo` alternative cannot be removed without affecting the pattern.

  Whether a reported alternative is removable has to be decided by the developer.

- `report: "all"`

  All cases of duplication and partial duplication (overlap) will be reported.

  Partial duplication (overlap) is typically not harmful and difficult to remove. E.g. the harmless overlap of `a.*|.*b` is `a.*b`.

  Partial duplication is only harmful if it occurs within a quantifier because then it can cause exponential backtracking. By default, this rule will try to report all cases of potential exponential backtracking.

  However, the rule might not be able to detect that overlap happens within a quantifier if the regex was constructed at runtime. Example:

  ```javascript
  const partial = /a.*|.*b/;
  const pattern = new RegExp("(?:" + partial.source + ")+\nfoo");
  ```

  If your codebase contained many such partial regexes, then reporting all cases might yield cases that could not be identified as causing exponential backtracking.

### `alwaysReportExponentialBacktracking: boolean`

If set to `true`, then this rule will always report partial duplications that can cause exponential backtracking. This option is set to `true` by default.

Only set this option to `false` if you have some other mean to reliably detect exponential backtracking.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-dupe-disjunctions.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-dupe-disjunctions.ts)
