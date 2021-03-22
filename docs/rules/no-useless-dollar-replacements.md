---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-useless-dollar-replacements"
description: "disallow useless `$` replacements in replacement string"
since: "v0.6.0"
---
# regexp/no-useless-dollar-replacements

> disallow useless `$` replacements in replacement string

## :book: Rule Details

This rule aims to detect and disallow useless `$` replacements in regular expression replacements.

<eslint-code-block>

```js
/* eslint regexp/no-useless-dollar-replacements: "error" */
const str = 'John Smith';

/* ✓ GOOD */
var newStr = str.replace(/(\w+)\s(\w+)/, '$2, $1');
// newStr = "Smith, John"

var newStr = str.replace(/(?<first>\w+)\s(?<last>\w+)/, '$<last>, $<first>');
// newStr = "Smith, John"

'123456789012'.replaceAll(/(.)../g, '$1**'); // "1**4**7**0**"

/* ✗ BAD */
var newStr = str.replace(/(\w+)\s(\w+)/, '$3, $1 $2');
// newStr = "$3, John Smith"

var newStr = str.replace(/(?<first>\w+)\s(?<last>\w+)/, '$<last>, $<first> $<middle>');
// newStr = "Smith, John "

var newStr = str.replace(/(\w+)\s(\w+)/, '$<last>, $<first>');
// newStr = "$<last>, $<first>"

'123456789012'.replaceAll(/.(.)./g, '*$2*'); // "*$2**$2**$2**$2*"
```

</eslint-code-block>

## :wrench: Options

Nothing.

## :couple: Related rules

- [regexp/prefer-escape-replacement-dollar-char](./prefer-escape-replacement-dollar-char.md)

## :books: Further reading

- [MDN Web Docs - String.prototype.replace() > Specifying a string as a parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_a_parameter)

## :rocket: Version

This rule was introduced in eslint-plugin-regexp v0.6.0

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-useless-dollar-replacements.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-useless-dollar-replacements.ts)
