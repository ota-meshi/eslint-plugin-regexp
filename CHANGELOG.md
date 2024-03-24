# eslint-plugin-regexp

## 2.4.0

### Minor Changes

- Change default configuration of `prefer-d` to ignore digits inside character classes. ([#715](https://github.com/ota-meshi/eslint-plugin-regexp/pull/715))

## 2.3.0

### Minor Changes

- Add support for flat config ([#702](https://github.com/ota-meshi/eslint-plugin-regexp/pull/702))

## 2.2.0

### Minor Changes

- Add `allowNamed` option to `no-unused-capturing-group` rule to allow for unused named capturing groups. ([#689](https://github.com/ota-meshi/eslint-plugin-regexp/pull/689))

## 2.1.2

### Patch Changes

- Fixed false positives for hasIndices in `regexp/no-unused-capturing-group` ([#676](https://github.com/ota-meshi/eslint-plugin-regexp/pull/676))

## 2.1.1

### Patch Changes

- Improved error message and docs for `regexp/no-useless-non-capturing-group` ([#668](https://github.com/ota-meshi/eslint-plugin-regexp/pull/668))

## 2.1.0

### Minor Changes

- Improve detection of useless assertions for `regexp/no-useless-assertion` ([#663](https://github.com/ota-meshi/eslint-plugin-regexp/pull/663))

- Add suggestions for `regexp/no-useless-assertion` ([#666](https://github.com/ota-meshi/eslint-plugin-regexp/pull/666))

### Patch Changes

- Fixed crash for v flag in `regexp/optimal-quantifier-concatenation` ([#660](https://github.com/ota-meshi/eslint-plugin-regexp/pull/660))

- Fixed minor mistake in message of `no-misleading-unicode-character` ([#664](https://github.com/ota-meshi/eslint-plugin-regexp/pull/664))

## 2.0.0

### Major Changes

- Drop support for Node.js <=v17, and v19 ([#550](https://github.com/ota-meshi/eslint-plugin-regexp/pull/550))

- Add `regexp/simplify-set-operations` rule ([#595](https://github.com/ota-meshi/eslint-plugin-regexp/pull/595))

- Remove deprecated rules ([#652](https://github.com/ota-meshi/eslint-plugin-regexp/pull/652))

- Add `regexp/no-useless-string-literal` rule ([#639](https://github.com/ota-meshi/eslint-plugin-regexp/pull/639))

- Add `regexp/no-empty-string-literal` rule ([#632](https://github.com/ota-meshi/eslint-plugin-regexp/pull/632))

- Change recommended config ([#552](https://github.com/ota-meshi/eslint-plugin-regexp/pull/552))

- Drop support for ESLint < v8.44 ([#558](https://github.com/ota-meshi/eslint-plugin-regexp/pull/558))

- Add `regexp/no-useless-set-operand` rule ([#625](https://github.com/ota-meshi/eslint-plugin-regexp/pull/625))

- Add `regexp/prefer-set-operation` rule ([#616](https://github.com/ota-meshi/eslint-plugin-regexp/pull/616))

- Use jsdoc-type-pratt-parser instead of jsdoctypeparser ([#651](https://github.com/ota-meshi/eslint-plugin-regexp/pull/651))

### Minor Changes

- Add support for `v` flag to `regexp/no-dupe-disjunctions` ([#612](https://github.com/ota-meshi/eslint-plugin-regexp/pull/612))

- Add support for `v` flag to `regexp/optimal-quantifier-concatenation` ([#618](https://github.com/ota-meshi/eslint-plugin-regexp/pull/618))

- Add support for v flag to `regexp/no-non-standard-flag` rule ([#596](https://github.com/ota-meshi/eslint-plugin-regexp/pull/596))

- Add `regexp/grapheme-string-literal` rule ([#646](https://github.com/ota-meshi/eslint-plugin-regexp/pull/646))

- Add support for `v` flag to `regexp/prefer-character-class` ([#619](https://github.com/ota-meshi/eslint-plugin-regexp/pull/619))

- Improve `regexp/strict` rule to ignore patterns with v flag ([#591](https://github.com/ota-meshi/eslint-plugin-regexp/pull/591))

- Add support for string literal to `regexp/no-empty-alternative` ([#633](https://github.com/ota-meshi/eslint-plugin-regexp/pull/633))

- Add support for v flag to `regexp/prefer-d` rule ([#602](https://github.com/ota-meshi/eslint-plugin-regexp/pull/602))

- Add support for `v` flag to `regexp/use-ignore-case` ([#617](https://github.com/ota-meshi/eslint-plugin-regexp/pull/617))

- Update refa, regexp-ast-analysis, and scslre ([#568](https://github.com/ota-meshi/eslint-plugin-regexp/pull/568))

- Add support for v flag to `regexp/prefer-unicode-codepoint-escapes` rule ([#592](https://github.com/ota-meshi/eslint-plugin-regexp/pull/592))

- Improve `regexp/negation` rule to report nested negation character classes ([#595](https://github.com/ota-meshi/eslint-plugin-regexp/pull/595))

- Add support for v flag to `regexp/no-dupe-characters-character-class` rule ([#608](https://github.com/ota-meshi/eslint-plugin-regexp/pull/608))

- Add support for v flag to `regexp/no-useless-character-class` rule ([#593](https://github.com/ota-meshi/eslint-plugin-regexp/pull/593))

- Add support for v flag to `regexp/sort-character-class-elements` rule ([#588](https://github.com/ota-meshi/eslint-plugin-regexp/pull/588))

- Add support for v flag to `regexp/negation` rule ([#560](https://github.com/ota-meshi/eslint-plugin-regexp/pull/560))

- Use Intl.Segmenter instead of grapheme-splitter ([#642](https://github.com/ota-meshi/eslint-plugin-regexp/pull/642))

- Add support for `v` flag to `regexp/no-misleading-capturing-group` ([#620](https://github.com/ota-meshi/eslint-plugin-regexp/pull/620))

- Add support for v flag to `regexp/unicode-escape` rule ([#592](https://github.com/ota-meshi/eslint-plugin-regexp/pull/592))

- Add support for `v` flag to `regexp/match-any` ([#628](https://github.com/ota-meshi/eslint-plugin-regexp/pull/628))

- Improve `regexp/require-unicode-regexp` rule to allow patterns with v flag ([#586](https://github.com/ota-meshi/eslint-plugin-regexp/pull/586))

- Add support for `v` flag to `regexp/no-contradiction-with-assertion` ([#606](https://github.com/ota-meshi/eslint-plugin-regexp/pull/606))

- Add support for v flag to `regexp/no-empty-character-class` ([#637](https://github.com/ota-meshi/eslint-plugin-regexp/pull/637))

- Add suggestions for `regexp/no-lazy-ends` ([#624](https://github.com/ota-meshi/eslint-plugin-regexp/pull/624))

- Improve `regexp/sort-alternatives` rule to add support for string alternatives and v flag ([#587](https://github.com/ota-meshi/eslint-plugin-regexp/pull/587))

- Add suggestions for `regexp/optimal-lookaround-quantifier` ([#623](https://github.com/ota-meshi/eslint-plugin-regexp/pull/623))

- Add support for v flag to `regexp/no-useless-escape` rule ([#585](https://github.com/ota-meshi/eslint-plugin-regexp/pull/585))

- Update `@eslint-community/regexpp` to v4.6 ([#554](https://github.com/ota-meshi/eslint-plugin-regexp/pull/554))

- Add support for v flag to `regexp/no-misleading-unicode-character` rule ([#584](https://github.com/ota-meshi/eslint-plugin-regexp/pull/584))

- Add `regexp/require-unicode-sets-regexp` rule ([#598](https://github.com/ota-meshi/eslint-plugin-regexp/pull/598))

- Add suggestions for `regexp/no-empty-alternative` ([#621](https://github.com/ota-meshi/eslint-plugin-regexp/pull/621))

- `prefer-w`: Add support for `v` flag ([#578](https://github.com/ota-meshi/eslint-plugin-regexp/pull/578))

- Added suggestions for `regexp/no-escape-backspace` ([#622](https://github.com/ota-meshi/eslint-plugin-regexp/pull/622))

- Improve `regexp/no-invalid-regexp` rule to check for unknown pattern flags. ([#583](https://github.com/ota-meshi/eslint-plugin-regexp/pull/583))

- Add support for `v` flag to `regexp/prefer-predefined-assertion` ([#611](https://github.com/ota-meshi/eslint-plugin-regexp/pull/611))

### Patch Changes

- fix: update regexpp ([#634](https://github.com/ota-meshi/eslint-plugin-regexp/pull/634))

- Fixed incorrect default of `ignoreSticky` option in `regexp/no-super-linear-move` ([#630](https://github.com/ota-meshi/eslint-plugin-regexp/pull/630))

- Use new refa AST transformers and fixed max character for `v`-flag regexes in `no-dupe-disjunctions` and `no-super-linear-move`. ([#569](https://github.com/ota-meshi/eslint-plugin-regexp/pull/569))

- fix: autofix for incorrect no-escaping in `regexp/no-useless-string-literal` ([#645](https://github.com/ota-meshi/eslint-plugin-regexp/pull/645))

- Fix typo in `no-useless-non-capturing-group` ([#555](https://github.com/ota-meshi/eslint-plugin-regexp/pull/555))

- Use new ESLint API ([#654](https://github.com/ota-meshi/eslint-plugin-regexp/pull/654))

- Account for `v` flag in 2 util methods ([#570](https://github.com/ota-meshi/eslint-plugin-regexp/pull/570))

- Add more `v` flag tests ([#627](https://github.com/ota-meshi/eslint-plugin-regexp/pull/627))

- Fix `parseFlags` ([#571](https://github.com/ota-meshi/eslint-plugin-regexp/pull/571))

## 2.0.0-next.15

### Patch Changes

- Use new ESLint API ([#654](https://github.com/ota-meshi/eslint-plugin-regexp/pull/654))

## 2.0.0-next.14

### Major Changes

- Remove deprecated rules ([#652](https://github.com/ota-meshi/eslint-plugin-regexp/pull/652))

- Use jsdoc-type-pratt-parser instead of jsdoctypeparser ([#651](https://github.com/ota-meshi/eslint-plugin-regexp/pull/651))

## 2.0.0-next.13

### Minor Changes

- Add `regexp/grapheme-string-literal` rule ([#646](https://github.com/ota-meshi/eslint-plugin-regexp/pull/646))

- Use Intl.Segmenter instead of grapheme-splitter ([#642](https://github.com/ota-meshi/eslint-plugin-regexp/pull/642))

### Patch Changes

- fix: autofix for incorrect no-escaping in `regexp/no-useless-string-literal` ([#645](https://github.com/ota-meshi/eslint-plugin-regexp/pull/645))

## 2.0.0-next.12

### Major Changes

- Add `regexp/no-useless-string-literal` rule ([#639](https://github.com/ota-meshi/eslint-plugin-regexp/pull/639))

### Minor Changes

- Add support for v flag to `regexp/no-empty-character-class` ([#637](https://github.com/ota-meshi/eslint-plugin-regexp/pull/637))

## 2.0.0-next.11

### Major Changes

- Add `regexp/simplify-set-operations` rule ([#595](https://github.com/ota-meshi/eslint-plugin-regexp/pull/595))

- Add `regexp/no-empty-string-literal` rule ([#632](https://github.com/ota-meshi/eslint-plugin-regexp/pull/632))

### Minor Changes

- Add support for string literal to `regexp/no-empty-alternative` ([#633](https://github.com/ota-meshi/eslint-plugin-regexp/pull/633))

- Improve `regexp/negation` rule to report nested negation character classes ([#595](https://github.com/ota-meshi/eslint-plugin-regexp/pull/595))

### Patch Changes

- fix: update regexpp ([#634](https://github.com/ota-meshi/eslint-plugin-regexp/pull/634))

## 2.0.0-next.10

### Major Changes

- Add `regexp/no-useless-set-operand` rule ([#625](https://github.com/ota-meshi/eslint-plugin-regexp/pull/625))

### Minor Changes

- Add support for `v` flag to `regexp/match-any` ([#628](https://github.com/ota-meshi/eslint-plugin-regexp/pull/628))

### Patch Changes

- Fixed incorrect default of `ignoreSticky` option in `regexp/no-super-linear-move` ([#630](https://github.com/ota-meshi/eslint-plugin-regexp/pull/630))

- Add more `v` flag tests ([#627](https://github.com/ota-meshi/eslint-plugin-regexp/pull/627))

## 2.0.0-next.9

### Major Changes

- Add `regexp/prefer-set-operation` rule ([#616](https://github.com/ota-meshi/eslint-plugin-regexp/pull/616))

### Minor Changes

- Add support for `v` flag to `regexp/optimal-quantifier-concatenation` ([#618](https://github.com/ota-meshi/eslint-plugin-regexp/pull/618))

- Add support for `v` flag to `regexp/prefer-character-class` ([#619](https://github.com/ota-meshi/eslint-plugin-regexp/pull/619))

- Add support for `v` flag to `regexp/use-ignore-case` ([#617](https://github.com/ota-meshi/eslint-plugin-regexp/pull/617))

- Add support for `v` flag to `regexp/no-misleading-capturing-group` ([#620](https://github.com/ota-meshi/eslint-plugin-regexp/pull/620))

- Add suggestions for `regexp/no-lazy-ends` ([#624](https://github.com/ota-meshi/eslint-plugin-regexp/pull/624))

- Add suggestions for `regexp/optimal-lookaround-quantifier` ([#623](https://github.com/ota-meshi/eslint-plugin-regexp/pull/623))

- Add suggestions for `regexp/no-empty-alternative` ([#621](https://github.com/ota-meshi/eslint-plugin-regexp/pull/621))

- Added suggestions for `regexp/no-escape-backspace` ([#622](https://github.com/ota-meshi/eslint-plugin-regexp/pull/622))

## 2.0.0-next.8

### Minor Changes

- Add support for v flag to `regexp/sort-character-class-elements` rule ([#588](https://github.com/ota-meshi/eslint-plugin-regexp/pull/588))

## 2.0.0-next.7

### Minor Changes

- Add support for `v` flag to `regexp/no-dupe-disjunctions` ([#612](https://github.com/ota-meshi/eslint-plugin-regexp/pull/612))

- Add support for v flag to `regexp/no-dupe-characters-character-class` rule ([#608](https://github.com/ota-meshi/eslint-plugin-regexp/pull/608))

- Add support for v flag to `regexp/no-useless-character-class` rule ([#593](https://github.com/ota-meshi/eslint-plugin-regexp/pull/593))

- Improve `regexp/sort-alternatives` rule to add support for string alternatives and v flag ([#587](https://github.com/ota-meshi/eslint-plugin-regexp/pull/587))

- Add `regexp/require-unicode-sets-regexp` rule ([#598](https://github.com/ota-meshi/eslint-plugin-regexp/pull/598))

- Add support for `v` flag to `regexp/prefer-predefined-assertion` ([#611](https://github.com/ota-meshi/eslint-plugin-regexp/pull/611))

## 2.0.0-next.6

### Minor Changes

- Add support for v flag to `regexp/prefer-unicode-codepoint-escapes` rule ([#592](https://github.com/ota-meshi/eslint-plugin-regexp/pull/592))

- Add support for v flag to `regexp/unicode-escape` rule ([#592](https://github.com/ota-meshi/eslint-plugin-regexp/pull/592))

### Patch Changes

- Add support for `v` flag to `regexp/no-contradiction-with-assertion` ([#606](https://github.com/ota-meshi/eslint-plugin-regexp/pull/606))

## 2.0.0-next.5

### Minor Changes

- Add support for v flag to `regexp/prefer-d` rule ([#602](https://github.com/ota-meshi/eslint-plugin-regexp/pull/602))

- Add support for v flag to `regexp/negation` rule ([#560](https://github.com/ota-meshi/eslint-plugin-regexp/pull/560))

- Improve `regexp/require-unicode-regexp` rule to allow patterns with v flag ([#586](https://github.com/ota-meshi/eslint-plugin-regexp/pull/586))

- Add support for v flag to `regexp/no-useless-escape` rule ([#585](https://github.com/ota-meshi/eslint-plugin-regexp/pull/585))

- Add support for v flag to `regexp/no-misleading-unicode-character` rule ([#584](https://github.com/ota-meshi/eslint-plugin-regexp/pull/584))

- `prefer-w`: Add support for `v` flag ([#578](https://github.com/ota-meshi/eslint-plugin-regexp/pull/578))

## 2.0.0-next.4

### Minor Changes

- Add support for v flag to `regexp/no-non-standard-flag` rule ([#596](https://github.com/ota-meshi/eslint-plugin-regexp/pull/596))

- Improve `regexp/strict` rule to ignore patterns with v flag ([#591](https://github.com/ota-meshi/eslint-plugin-regexp/pull/591))

## 2.0.0-next.3

### Minor Changes

- Improve `regexp/no-invalid-regexp` rule to check for unknown pattern flags. ([#583](https://github.com/ota-meshi/eslint-plugin-regexp/pull/583))

## 2.0.0-next.2

### Patch Changes

- Use new refa AST transformers and fixed max character for `v`-flag regexes in `no-dupe-disjunctions` and `no-super-linear-move`. ([#569](https://github.com/ota-meshi/eslint-plugin-regexp/pull/569))

- Account for `v` flag in 2 util methods ([#570](https://github.com/ota-meshi/eslint-plugin-regexp/pull/570))

- Fix `parseFlags` ([#571](https://github.com/ota-meshi/eslint-plugin-regexp/pull/571))

## 2.0.0-next.1

### Major Changes

- Drop support for ESLint < v8.44 ([#558](https://github.com/ota-meshi/eslint-plugin-regexp/pull/558))

### Minor Changes

- Update refa, regexp-ast-analysis, and scslre ([#568](https://github.com/ota-meshi/eslint-plugin-regexp/pull/568))

### Patch Changes

- Fix typo in `no-useless-non-capturing-group` ([#555](https://github.com/ota-meshi/eslint-plugin-regexp/pull/555))

## 2.0.0-next.0

### Major Changes

- Drop support for Node.js <=v17, and v19 ([#550](https://github.com/ota-meshi/eslint-plugin-regexp/pull/550))

- Change recommended config ([#552](https://github.com/ota-meshi/eslint-plugin-regexp/pull/552))

### Minor Changes

- Update `@eslint-community/regexpp` to v4.6 ([#554](https://github.com/ota-meshi/eslint-plugin-regexp/pull/554))
