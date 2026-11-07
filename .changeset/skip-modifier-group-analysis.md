---
"eslint-plugin-regexp": patch
---

Skip pattern analysis for regular expressions containing modifier groups such as `(?i:...)` or `(?-i:...)` to prevent autofixes from changing their meaning. Until modifier groups are supported, these patterns do not receive pattern-based diagnostics or fixes. Invalid regular expression strings in constructors are still reported.
