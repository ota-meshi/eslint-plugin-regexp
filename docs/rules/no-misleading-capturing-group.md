---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-misleading-capturing-group"
description: "disallow capturing groups that do not behave as one would expect"
since: "v1.12.0"
---
# regexp/no-misleading-capturing-group

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions).

<!-- end auto-generated rule header -->

> disallow capturing groups that do not behave as one would expect

## :book: Rule Details

This rule reports capturing groups that capture less text than their pattern might suggest.

E.g. in `/a+(a*)/`, `(a*)` will **always** capture 0 characters because all `a`s are already consumed by `a+`. This is quite surprising behavior because `a*` suggests that the capturing group captures as many `a`s as possible.

Misleading capturing groups in regex indicate either unnecessary code that can be removed or an error in the regex. Which one it is, depends on the intended behavior of the regex and cannot be determined by this rule.

E.g. if the above example is really supposed to capture 0 characters, then the regex should be changed to `/a+()/` to make the intention explicit. Otherwise, then the parts of the regex surrounding `(a*)` have to be rewritten.

This rule generally assumes that the regex behaves correctly, despite its misleading form, when suggesting fixes. Suggested fixes therefor remove the misleading elements **without changing the behavior** of the regex.

<eslint-code-block>

```js
/* eslint regexp/no-misleading-capturing-group: "error" */

/* ✓ GOOD */
var foo = /a+(b*)/

/* ✗ BAD */
var foo = /a+(a*)/
var foo = /\w+(\d*)/
var foo = /^(a*).+/
```

</eslint-code-block>

## :wrench: Options

```json
{
  "regexp/no-misleading-capturing-group": [
    "error",
    {
      "reportBacktrackingEnds": true,
    }
  ]
}
```

- `reportBacktrackingEnds`

  This rule will report quantifiers at the end of capturing groups that might backtrack for certain strings.

  E.g. when `/^(a*).+$/m` is used to match the string `"aa"`, then `a*` will capture both `a`s at first, but is then forced to give up the last `a` to `.+` to make the whole regex accept. So `(a*)` only capture the first `a`. This is misleading because one would expect that `(a*)` should capture all `a`s at the start of the string, but this is not the case.

  Because this behavior might be intentional, some users might want to turn off this type of reporting.

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v1.12.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-misleading-capturing-group.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-misleading-capturing-group.ts)
