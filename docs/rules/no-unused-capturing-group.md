---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-unused-capturing-group"
description: "disallow unused capturing group"
since: "v0.6.0"
---
# regexp/no-unused-capturing-group

> disallow unused capturing group

## :book: Rule Details

This rule aims to optimize regular expressions by replacing unused capturing groups with non-capturing groups.

<eslint-code-block>

```js
/* eslint regexp/no-unused-capturing-group: "error" */

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
var replaced = '2000-12-31'.replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/u, '$1/$2/$3') // "2000/12/31"
var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, (_, y, m) => `${y}/${m}`) // "2000/12"

var isDate = /(\d{4})-(\d{2})-(\d{2})/.test('2000-12-31') // true

var matches = '2000-12-31 2001-01-01'.match(/(\d{4})-(\d{2})-(\d{2})/g) // ["2000-12-31", "2001-01-01"]

var index = '2000-12-31'.search(/(\d{4})-(\d{2})-(\d{2})/) // 0
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/no-useless-dollar-replacements](./no-useless-dollar-replacements.md)

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.6.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-unused-capturing-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-unused-capturing-group.ts)
