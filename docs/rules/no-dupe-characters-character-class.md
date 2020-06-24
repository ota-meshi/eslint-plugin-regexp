# disallow duplicate characters in the RegExp character class (regexp/no-dupe-characters-character-class)

- :gear: This rule is included in `"plugin:regexp/all"`.

Because multiple same character classes in regular expressions only one is useful, they might be typing mistakes.

```js
var foo = /\\(\\)/
```

## Rule Details

This rule disallows duplicate characters in the RegExp character class.

Examples of **incorrect** code for this rule:

```js
/*eslint regexp/no-dupe-characters-character-class: "error"*/

var foo = /[\\(\\)]/
//          ^^ ^^        "\\" are duplicated
var foo = /[a-z\\s]/
//          ^^^  ^       "s" are duplicated
var foo = /[\w0-9]/
//          ^^^^^        "0-9" are duplicated
```

Examples of **correct** code for this rule:

```js
/*eslint regexp/no-dupe-characters-character-class: "error"*/

var foo = /[\(\)]/

var foo = /[a-z\s]/

var foo = /[\w]/
```
