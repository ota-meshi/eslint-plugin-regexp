---
"eslint-plugin-regexp": patch
---

Fix `regexp/no-useless-non-capturing-group` removing the group around a quantified assertion, which produced an invalid pattern
