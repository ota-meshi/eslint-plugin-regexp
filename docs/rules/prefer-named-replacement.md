---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/prefer-named-replacement"
description: "enforce using named replacement"
since: "v1.4.0"
---
# regexp/prefer-named-replacement

> enforce using named replacement

- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports and fixes `$n` parameter in replacement string that do not use the name of their referenced capturing group.

<eslint-code-block fix>

```js
/* eslint regexp/prefer-named-replacement: "error" */

/* ✓ GOOD */
"abc".replace(/a(?<foo>b)c/, '$<foo>');
"abc".replace(/a(b)c/, '$1');

/* ✗ BAD */
"abc".replace(/a(?<foo>b)c/, '$1');
```

</eslint-code-block>

## :wrench: Options

```json
{
  "regexp/prefer-named-replacement": ["error", {
      "strictTypes": true
  }]
}
```

- `strictTypes` ... If `true`, strictly check the type of object to determine if the string instance was used in `replace()` and `replaceAll()`. Default is `true`.  
  This option is always on when using TypeScript.

## :couple: Related rules

- [regexp/prefer-named-backreference]
- [regexp/prefer-named-capture-group]
- [regexp/prefer-result-array-groups]

[regexp/prefer-named-backreference]: ./prefer-named-backreference.md
[regexp/prefer-named-capture-group]: ./prefer-named-capture-group.md
[regexp/prefer-result-array-groups]: ./prefer-result-array-groups.md

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v1.4.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/prefer-named-replacement.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/prefer-named-replacement.ts)
