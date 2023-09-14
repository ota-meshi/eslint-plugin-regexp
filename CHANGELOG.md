# eslint-plugin-regexp

## 2.0.0-next.4

### Minor Changes

-   Add support for v flag to `regexp/no-non-standard-flag` rule ([#596](https://github.com/ota-meshi/eslint-plugin-regexp/pull/596))

-   Improve `regexp/strict` rule to ignore patterns with v flag ([#591](https://github.com/ota-meshi/eslint-plugin-regexp/pull/591))

## 2.0.0-next.3

### Minor Changes

-   Improve `regexp/no-invalid-regexp` rule to check for unknown pattern flags. ([#583](https://github.com/ota-meshi/eslint-plugin-regexp/pull/583))

## 2.0.0-next.2

### Patch Changes

-   Use new refa AST transformers and fixed max character for `v`-flag regexes in `no-dupe-disjunctions` and `no-super-linear-move`. ([#569](https://github.com/ota-meshi/eslint-plugin-regexp/pull/569))

-   Account for `v` flag in 2 util methods ([#570](https://github.com/ota-meshi/eslint-plugin-regexp/pull/570))

-   Fix `parseFlags` ([#571](https://github.com/ota-meshi/eslint-plugin-regexp/pull/571))

## 2.0.0-next.1

### Major Changes

-   Drop support for ESLint < v8.44 ([#558](https://github.com/ota-meshi/eslint-plugin-regexp/pull/558))

### Minor Changes

-   Update refa, regexp-ast-analysis, and scslre ([#568](https://github.com/ota-meshi/eslint-plugin-regexp/pull/568))

### Patch Changes

-   Fix typo in `no-useless-non-capturing-group` ([#555](https://github.com/ota-meshi/eslint-plugin-regexp/pull/555))

## 2.0.0-next.0

### Major Changes

-   Drop support for Node.js <=v17, and v19 ([#550](https://github.com/ota-meshi/eslint-plugin-regexp/pull/550))

-   Change recommended config ([#552](https://github.com/ota-meshi/eslint-plugin-regexp/pull/552))

### Minor Changes

-   Update `@eslint-community/regexpp` to v4.6 ([#554](https://github.com/ota-meshi/eslint-plugin-regexp/pull/554))
