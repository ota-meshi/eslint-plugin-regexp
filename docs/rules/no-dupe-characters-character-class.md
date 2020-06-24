---
pageClass: "rule-details"
sidebarDepth: 0
title: "regexp/no-dupe-characters-character-class"
description: "disallow duplicate characters in the RegExp character class"
---
# regexp/no-dupe-characters-character-class

> disallow duplicate characters in the RegExp character class

- :gear: This rule is included in `"plugin:regexp/recommended"`.

This rule reports `@keyframes` is not used in Scoped CSS.

<eslint-code-block :rules="{'regexp/no-unused-keyframes': ['error']}">

```vue
<style scoped>
.item {
    animation-name: slidein;
}

/* ✗ BAD */
@keyframes unused-animation {
}

/* ✓ GOOD */
@keyframes slidein {
}
</style>
```

</eslint-code-block>

## :books: Further reading

- None

## Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/no-dupe-characters-character-class.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/no-dupe-characters-character-class.js)
