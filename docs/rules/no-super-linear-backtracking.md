---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-super-linear-backtracking"
description: "disallow exponential and polynomial backtracking"
since: "v0.13.0"
---
# regexp/no-super-linear-backtracking

> disallow exponential and polynomial backtracking

- :gear: This rule is included in `"plugin:regexp/recommended"`.
- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.

## :book: Rule Details

This rule reports cases of exponential and polynomial backtracking.

These types of backtracking almost always cause an exponential or polynomial worst-case runtime. This super-linear worst-case runtime can be exploited by attackers in what is called [Regular expression Denial of Service - ReDoS][1].

<eslint-code-block fix>

```js
/* eslint regexp/no-super-linear-backtracking: "error" */

/* ✓ GOOD */
var foo = /a*b+a*$/;
var foo = /(?:a+)?/;

/* ✗ BAD */
var foo = /(?:a+)+$/;
var foo = /a*b?a*$/;
var foo = /(?:a|b|c+)*$/;
// not all cases can automatically be fixed
var foo = /\s*(.*?)(?=:)/;
var foo = /.+?(?=\s*=)/;
```

</eslint-code-block>

### Limitations

The rule only implements a very simplistic detection method and can only detect very simple cases of super-linear backtracking right now.

While the detection will improve in the future, this rule will never be able to perfectly detect all cases super-linear backtracking.


## :wrench: Options

```json
{
  "regexp/no-super-linear-backtracking": ["error", {
    "report": "certain"
  }]
}
```

### `report`

Every input string that exploits super-linear worst-case runtime can be separated into 3 parts:

1. A prefix to leads to exploitable part of the regex.
2. A non-empty string that will be repeated to exploit the ambiguity.
3. A rejecting suffix that forces the regex engine to backtrack.

For some regexes it is not possible to find a rejecting suffix even though the regex contains exploitable ambiguity (e.g. `/(?:a+)+/`). These regexes are safe as long as they are used as is. However, regexes can also be used as building blocks to create more complex regexes. In this case, the ambiguity might cause super-linear backtracking in the composite regex.

This options control whether ambiguity that might cause super-linear backtracking will be reported.

- `report: "certain"`  (_default_)

  Only certain cases of super-linear backtracking will be reported.

  This means that ambiguity will only be reported if this rule can prove that there exists a rejecting suffix.

- `report: "potential"`

  All certain and potential cases of super-linear backtracking will be reported.

  Potential cases are ones where a rejecting might be possible. Whether the reported potential cases are false positives or not has to be decided by the developer.

## :books: Further reading

- [Regular expression Denial of Service - ReDoS][1]
- [scslre]

[1]: https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS
[scslre]: https://github.com/RunDevelopment/scslre

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.13.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-super-linear-backtracking.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-super-linear-backtracking.ts)
