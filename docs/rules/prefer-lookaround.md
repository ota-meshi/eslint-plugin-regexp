---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-lookaround"
description: "prefer lookarounds over capturing group that do not replace"
since: "v1.2.0"
---
# regexp/prefer-lookaround

> prefer lookarounds over capturing group that do not replace

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports string replacement using capturing groups that can be replaced with lookaround assertions.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-lookaround: "error" */

/* ✓ GOOD */
var str = 'JavaScript'.replace(/Java(?=Script)/g, 'Type')

/* ✗ BAD */
var str = 'JavaScript'.replace(/Java(Script)/g, 'Type$1')
```

</eslint-code-block>

## :wrench: Options

```json
{
  "regexp/prefer-lookaround": ["error", {
      "strictTypes": true
  }]
}
```

- `strictTypes` ... If `true`, strictly check the type of object to determine if the regex instance was used in `replace()` and `replaceAll()`. Default is `true`.  
  This option is always on when using TypeScript.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v1.2.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-lookaround.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-lookaround.ts)
