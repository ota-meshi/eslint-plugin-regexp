---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-super-linear-move"
description: "disallow quantifiers that cause quadratic moves"
since: "v0.13.0"
---
# regexp/no-super-linear-move

> disallow quantifiers that cause quadratic moves

## :book: Rule Details

This rule reports super-linear worst-case runtime caused by a regex being moved across the input string. The reported cases are a problem because the super-linear worst-case runtime can be exploited by attackers in what is called [Regular expression Denial of Service - ReDoS][1].

<eslint-code-block>

```js
/* eslint regexp/no-super-linear-move: "error" */

/* ✓ GOOD */
var foo = /abc|def/;
var foo = /\ba+b/;
var foo = /^\s*foo:/;
var foo = /ab+/;
var foo = /#.*/;

/* ✗ BAD */
var foo = /a+b/;
var foo = /^\s*foo:/m;
var foo = /<.*?>/;
```

</eslint-code-block>

### Background

Regexes are often used to find text of within a string (e.g. `/abc/.exec("123 abc def")`). The position of the matching text is unknown and has to be determined by the regex engine. In practice, the regex engine will move the regex across the input string character by character. While there are many optimizations to skip parts of the input string, there will still be _O(n)_ possible positions. If there is no text matching the regex in the input string, then all _O(n)_ positions will be checked.

This is not problem in it self, _O(n)_ is expected for linear string searching algorithms.

Problems arise when the regex itself takes more than _O(1)_ steps (on average) to reject any position within the input.

Example: The regex `/^a+b/` takes _O(n)_ steps to find no match in an input of _n_-many `a`s. However, the regex `/a+b/` (no assertion) takes _O(n)_ steps to find no match in the same input at position 0. It will take another _O(n-1)_ steps at position 1, another _O(n-2)_ steps at position 2, and so on. In total, `/a+b/` will take _O(n^2)_ steps to find no match in an input of _n_-many `a`s.

If a regex is moved across the string and takes _O(n)_ steps (on average) to reject each of the _O(n)_ possible positions, then it will reject the input string in _O(n^2)_ steps.

### Possible fixes

There are multiple ways to fix this kind of super-linear runtime.

However, there is no one-site-fits-all solution. Adequate testing and code review are necessary to ensure that the fixed regex is still correct.

#### Change the quantifier

If the quantifier is preceded by an assertion, the quantifier might be too broad (= accept too many characters). Narrowing down the quantifier might fix the issue.

Example: `/^\s*(\w+)\s*[:=]/m`

This is a simple regex to find keys in a config file. Keys must be at the start of a line and may be surrounded by whitespace characters.

This rule says that the first `\s*` causes quadratic runtime for "any attack string `/[\n\r\u2028\u2029]+/`."

The problem with `\s*` is that `\s` also allows line break characters (the characters in the attack string). `^` already ensures the "start of a line" requirement, so there is no reason to allow line breaks after the `^`.

The fix is to remove all line break characters from `\s`. This is difficult, so let's cheat a little and say that only spaces and tabs (`[\t ]`) are allows to surround the key.

<eslint-code-block>

```js
/* eslint regexp/no-super-linear-move: "error" */

/* ✗ BAD */
var example = /^\s*(\w+)\s*[:=]/m

/* ✓ FIXED */
var fix = /^[\t ]*(\w+)[\t ]*[:=]/m
```

</eslint-code-block>

#### Limit the quantifier

All quantifiers reported by this rule are unbound (= maximum is infinite). This is because attackers need strings with a lengths >1000 character to exploit the quadratic runtime.

If the quantifier simply stops searching after some maximum number of steps, the quantifier isn't exploitable.

Note: The maximum of the quantifier should be reasonably small (typically <100). Choosing a large maximum (>1000) will cause the quantifier to be exploitable despite the limit.

Example: `/((?:\\{2})*)(\\?)\|/g`

This regex **was** used by [`minimatch`](https://github.com/isaacs/minimatch) to find escaped and unescaped `|` characters.

This rule says that the `(?:\\{2})*` causes quadratic runtime for "any attack string `/(?:\\{2})+/`."

The fix is to limit the `(?:\\{2})*` quantifier. `minimatch` limited it to at most 64 repetitions. You read more about this vulnerability [here](https://medium.com/node-security/minimatch-redos-vulnerability-590da24e6d3c).

<eslint-code-block>

```js
/* eslint regexp/no-super-linear-move: "error" */

/* ✗ BAD */
var example = /((?:\\{2})*)(\\?)\|/g

/* ✓ FIXED */
var fix = /((?:\\{2}){0,64})(\\?)\|/g
```

</eslint-code-block>

#### Add an assertion

Adding a lookbehind, `\b`, or `^` assertion at the start of the pattern can solve a lot of issues.

This fix is typically only applicable if the exploitable quantifier can consume exactly one character per iteration. Quantifiers that can consume more than character per iteration (e.g. `(?:abc)+`, `(?:ab?)+`) are very difficult to fix with this approach.

Example: `/[a-z_][a-z_0-9]*(?=\s*\()/i`

This is a simple regex to find the names of functions and function-like macros in a C program.

This rule says that the first `[a-z_0-9]*` causes quadratic runtime for "any attack string `/[A-Z_]+/i`."

The problem is that `[a-z_][a-z_0-9]*` isn't guaranteed to start at the start of the function name, the `[a-z_]` can also match anywhere inside the function name.

The fix is to add an assertion to make sure that `[a-z_]` matches the first character of a name. We can use the lookbehind `(?<![a-z_0-9])` == `(?<!\w)`. In this case, it's also possible to use the built-in `\b` assertion.

Note that using `(?<![a-z_])` is not enough. `(?<![a-z_])[a-z_]` can still match in the middle of the name for names with numbers (e.g. `str2int`). The lookbehind has to disallow the characters of the quantifier `[a-z_0-9]*`.

<eslint-code-block>

```js
/* eslint regexp/no-super-linear-move: "error" */

/* ✗ BAD */
var example = /[a-z_][a-z_0-9]*(?=\s*\()/i

/* ✓ FIXED */
var fix1 = /(?<![a-z_0-9])[a-z_][a-z_0-9]*(?=\s*\()/i
var fix2 = /(?<!\w)[a-z_][a-z_0-9]*(?=\s*\()/i
var fix3 = /\b[a-z_][a-z_0-9]*(?=\s*\()/i
```

</eslint-code-block>

### Limitations of this rule

This rule implements a simple detection method. It is unable to find certain cases.

This means that this rule might not be able to verify fixed regexes. This rule might be unable to detect that supposedly fixed regexes are actually still vulnerable.


## :wrench: Options

```json
{
  "regexp/no-super-linear-move": ["error", {
    "report": "certain",
    "ignoreSticky": false
  }]
}
```

### `report: "certain" | "potential"`

This option has the same function as the [`report` option of `regexp/no-super-linear-backtracking`](./no-super-linear-backtracking.html#report). The default value is `"certain"`.

### `ignoreSticky: boolean`

By default, this rule ignores regexes with the sticky (`y`) flag. These regexes do not move across the input string on their own and they are mostly immune to this type of super-linear worst-case because of that. However, some algorithms (and even built-in JavaScript functions) manually move regexes across the string and others change the flags of regexes.

This option determines whether this rule will ignore regexes with sticky (`y`) flag.

- `ignoreSticky: true`  (_default_)

  Regexes with the sticky (`y`) flag will be ignored.

- `ignoreSticky: false`

  All regexes will be analysed.

### `ignorePartial: boolean`:

Some regexes are used as fragments to build more complex regexes. Example:

```js
const fn = /\w+(?=\s*\()/.source;
const pattern = RegExp(`#\\s*define\\s+${fn}`, "g");
```

Even if a fragment had exploitable quantifiers, it might not cause super-linear runtime depending on how the fragment is used.

- `ignorePartial: true`  (_default_)

  The rule does not check regexes used as a fragment. It assumes that fragments are used in a way such that super-linear runtime caused by moves is prevented.

- `ignorePartial: false`

  The rule checks all regexes regardless of how they are used.


## :books: Further reading

- [Regular expression Denial of Service - ReDoS][1]
- [scslre]

[1]: https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS
[scslre]: https://github.com/RunDevelopment/scslre

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.13.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-super-linear-move.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-super-linear-move.ts)
