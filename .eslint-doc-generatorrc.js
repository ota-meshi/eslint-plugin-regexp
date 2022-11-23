/** @type {import('eslint-doc-generator').GenerateOptions} */
module.exports = {
  ignoreConfig: ['all'],
  pathRuleList: ['README.md', 'docs/rules/index.md'],
  ruleDocSectionInclude: ['Rule Details', 'Version', 'Implementation'],
  ruleDocSectionOptions: false,
  ruleDocTitleFormat: 'prefix-name',
  splitBy: 'meta.docs.category',
  urlRuleDoc: 'https://ota-meshi.github.io/eslint-plugin-regexp/rules/{name}.html',
};
