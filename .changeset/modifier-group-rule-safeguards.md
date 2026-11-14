---
"eslint-plugin-regexp": patch
---

Prevent unsafe modifier-group autofixes in `no-useless-non-capturing-group`, `optimal-quantifier-concatenation`, `prefer-question-quantifier`, `letter-case` and `prefer-character-class`.

The two character-analysis rules, `optimal-quantifier-concatenation` and `prefer-character-class`, skip patterns containing modifier groups until their analysis supports local flags. Group-removal and optional-group rewrites skip modifier groups themselves. Case-insensitive letter normalization skips characters and ranges inside modifier groups; escape formatting remains enabled. Other rules continue analyzing these patterns.
