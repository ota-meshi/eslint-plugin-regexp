---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-dupe-disjunctions"
description: "disallow duplicate disjunctions"
since: "v0.4.0"
---
# regexp/no-dupe-disjunctions

> disallow duplicate disjunctions

- :gear: This rule is included in `"plugin:regexp/recommended"`.

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
        "reportExponentialBacktracking": "potential",
        "reportUnreachable": "certain"
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

### `reportExponentialBacktracking`

Partial duplications (overlaps) are only reported by `report: "all"` even though they sometimes cause exponential backtracking. This option will force the other `report` modes to also report partial duplications if the partial duplications are likely to cause exponential backtracking.

- `reportExponentialBacktracking: "potential"` (_default_)

  In this case, this rule will always report partial duplications that _might_ cause exponential backtracking.

  If the plugin cannot prove that a partial duplication is safe (= does not cause exponential backtracking), then the partial duplication will be reported. This might cause some false positives.

- `reportExponentialBacktracking: "certain"`

  In this case, this rule will report partial duplication that _can_ cause exponential backtracking.

  If the plugin can prove that a partial duplication is unsafe (= causes exponential backtracking), then the partial duplication will be reported. This might cause some false negatives.

- `reportExponentialBacktracking: "none"`

  In this case, no extra cases of partial duplication will be reported.

The `"potential"` and `"certain"` modes differ only in how they handle uncertainty. The rule might be unable to prove that partial duplication is safe or unsafe with 100% certainty. This typically happens around fragment regexes (regexes that are used as fragments to build more complex regexes). Because the rule might not be able to track how a regex fragment is used, it has to make assumptions:

- `"potential"` assumes that fragments might be used inside a (logical) star quantifier and reports all partial duplication.
- `"certain"` assumes that fragments will not be used inside a (logical) star quantifier and will only report partial duplication that is certain to cause exponential backtracking.

_Note:_ This option only affects `report` modes other than `"all"`.

### `reportUnreachable`

All `report` modes report unreachable alternatives. These are alternatives that can _never_ be reached because a previous alternative always accepts before them. I.e. in `/int|integer/.exec("integer")`, the `integer` alternative is unreachable because the `int` alternative will always accept before the `integer` alternative has a chance to.

However, some regexes are used as fragments to build more complex regexes. Example:

```js
const int = /int|integer/.source;
const pattern = RegExp(`\\b(${int}|\\d+)\\b`, "g");

"integer int".match(pattern)
// => [ 'integer', 'int' ]
```

In these fragments, seemingly unreachable alternatives might not actually be unreachable depending on how the fragment is used.

This option controls how this rule reports unreachable alternatives in fragments.

- `reportUnreachable: "potential"`

  In this case, this rule will always report unreachable alternatives, even in fragments.

  ```js
  const int = /int|integer/.source; // report (false positive)
  const pattern = RegExp(`\\b(${int}|\\d+)\\b`);
  ```

  ```js
  const int = /int|integer/.source; // report (true positive)
  const pattern = RegExp(`is (${int})`);
  ```

- `reportUnreachable: "certain"` (_default_)

  In this case, this rule will only report unreachable alternatives in non-fragment regexes.

  ```js
  const int = /int|integer/.source; // no report (true negative)
  const pattern = RegExp(`\\b(${int}|\\d+)\\b`);
  ```

  ```js
  const int = /int|integer/.source; // no report (false negative)
  const pattern = RegExp(`is (${int})`);
  ```

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-dupe-disjunctions.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-dupe-disjunctions.ts)
