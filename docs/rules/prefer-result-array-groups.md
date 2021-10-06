---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-result-array-groups"
description: "enforce using result array `groups`"
since: "v1.4.0"
---
# regexp/prefer-result-array-groups

> enforce using result array `groups`

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports and fixes regexp result arrays where named capturing groups are accessed by index instead of using [`groups`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Groups_and_Ranges#using_named_groups).

<eslint-code-block fix>

```js
/* eslint regexp/prefer-result-array-groups: "error" */

const regex = /(?<foo>a)(b)c/g
let match
while (match = regex.exec(str)) {
    /* ✓ GOOD */
    var p1 = match.groups.foo
    var p2 = match[2]

    /* ✗ BAD */
    var p1 = match[1]
}
```

</eslint-code-block>

## :wrench: Options

```json
{
  "regexp/prefer-result-array-groups": ["error", {
    "strictTypes": true
  }]
}
```

- `strictTypes` ... If `true`, strictly check the type of object to determine if the string instance was used in `match()` and `matchAll()`. Default is `true`.  
  This option is always on when using TypeScript.

## :couple: Related rules

- [regexp/prefer-named-backreference]
- [regexp/prefer-named-capture-group]
- [regexp/prefer-named-replacement]

[regexp/prefer-named-backreference]: ./prefer-named-backreference.md
[regexp/prefer-named-capture-group]: ./prefer-named-capture-group.md
[regexp/prefer-named-replacement]: ./prefer-named-replacement.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v1.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-result-array-groups.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-result-array-groups.ts)
