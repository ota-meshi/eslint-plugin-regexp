/** @type {import('eslint-doc-generator').GenerateOptions} */
module.exports = {
  configFormat: 'plugin-colon-prefix-name',
  ignoreConfig: ['all'],
  pathRuleList: ['README.md', 'docs/rules/index.md'],
  ruleDocSectionInclude: ['Rule Details', 'Version', 'Implementation'],
  ruleDocSectionOptions: false,
  ruleDocTitleFormat: 'prefix-name',
  ruleListSplit(rules) {
    return [
      {
        title: 'Possible Errors',
        rules: rules.filter(
          ([, rule]) => rule.meta.docs.category === 'Possible Errors' && !rule.meta.deprecated
        ),
      },
      {
        title: 'Best Practices',
        rules: rules.filter(
          ([, rule]) => rule.meta.docs.category === 'Best Practices' && !rule.meta.deprecated
        ),
      },
      {
        title: 'Stylistic Issues',
        rules: rules.filter(
          ([, rule]) => rule.meta.docs.category === 'Stylistic Issues' && !rule.meta.deprecated
        ),
      },
      {
        title: 'Deprecated',
        rules: rules.filter(([, rule]) => rule.meta.deprecated),
      },
    ];
  },
  urlRuleDoc(name, page) {
    if (page === 'README.md') {
      // Use URLs only in the README to link to the vitepress SPA.
      return `https://ota-meshi.github.io/eslint-plugin-regexp/rules/${name}.html`;
    }
  },
};
