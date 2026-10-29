---
"eslint-plugin-regexp": patch
---

Fix `regexp/optimal-quantifier-concatenation` autofix changing the meaning of a regex when a quantifier before a lookaround absorbs a quantifier inside the lookaround and more elements follow
