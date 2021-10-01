---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-unused-capturing-group"
description: "disallow unused capturing group"
since: "v0.6.0"
---
# regexp/no-unused-capturing-group

> disallow unused capturing group

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports unused capturing groups.

<eslint-code-block fix>

```js
/* eslint regexp/no-unused-capturing-group: ["error", { fixable: true }] */

/* ✓ GOOD */
var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2/$3') // "2000/12/31"
var replaced = '2000-12-31'.replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/u, '$<y>/$<m>/$<d>') // "2000/12/31"
var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, (_, y, m, d) => `${y}/${m}/${d}`) // "2000/12/31"

var isDate = /(?:\d{4})-(?:\d{2})-(?:\d{2})/.test('2000-12-31') // true

var matches = '2000-12-31 2001-01-01'.match(/(\d{4})-(\d{2})-(\d{2})/)
var y = matches[1] // "2000"
var m = matches[2] // "12"
var d = matches[3] // "31"

var index = '2000-12-31'.search(/(?:\d{4})-(?:\d{2})-(?:\d{2})/) // 0

/* ✗ BAD */
var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, 'Date') // "Date"
var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2') // "2000/12"
var replaced = '2000-12-31'.replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/u, '$<y>/$<m>') // "2000/12"
var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, (_, y, m) => `${y}/${m}`) // "2000/12"

var isDate = /(\d{4})-(\d{2})-(\d{2})/.test('2000-12-31') // true

var matches = '2000-12-31 2001-01-01'.match(/(\d{4})-(\d{2})-(\d{2})/g) // ["2000-12-31", "2001-01-01"]

var index = '2000-12-31'.search(/(\d{4})-(\d{2})-(\d{2})/) // 0
```

</eslint-code-block>

### Why no unused capturing groups?

Many people use capturing groups instead of non-capturing groups for convenience. `()` is simpler and feels more natural than the cryptic-looking `(?:)`.

However, using capturing groups in place of non-capturing groups also has negative consequences.

#### Performance

Capturing groups are slower than non-capturing groups.

This is by design. Capturing groups (as the name suggests) captured their matched text. The regex engine has to do extra work every time a capturing group is matched compared to a non-capturing group.

#### Code smell

A capturing group is intended to store its matched text so it can later be used, e.g. in text replacements.

That makes a capturing group quite similar to a variable in that its value (the captured text) is stored (by the regex engine) and can be accessed afterward (by the developer). However, if the captured text is not used, then the capturing group will essentially be an unused variable. This makes the regex harder to understand because other developers will have to constantly ask themselves: "Is this a capturing group because the captured text will be used later on in the code, or because `()` is faster to type?"

Using capturing groups only if the captured text is used makes their usage unambiguous and easier for others to understand.

## :wrench: Options

```json
{
  "regexp/no-unused-capturing-group": ["error", {
    "fixable": false
  }]
}
```

- `fixable: true | false`

  This option controls whether the rule is fixable. Defaults to `false`.

  This rule is not fixable by default. Unused capturing groups can indicate a mistake in the code that uses the regex, so changing the regex might not be the right fix. When enabling this option, be sure to carefully check its changes.

## :couple: Related rules

- [regexp/no-useless-dollar-replacements]

[regexp/no-useless-dollar-replacements]: ./no-useless-dollar-replacements.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.6.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-unused-capturing-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-unused-capturing-group.ts)
