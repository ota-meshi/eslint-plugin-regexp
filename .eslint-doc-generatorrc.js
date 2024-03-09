/** @type {import('eslint-doc-generator').GenerateOptions} */
const config = {  
  ignoreConfig: ['all', 'flat/all'],
  configEmoji: [
      ["recommended", "🔵"],
      ["flat/recommended", "🟢"],
  ],
  pathRuleList: ['README.md', 'docs/rules/index.md'],
  ruleDocSectionInclude: ['Rule Details', 'Version', 'Implementation'],
  ruleDocSectionOptions: false,
  ruleDocTitleFormat: 'prefix-name',
  ruleListColumns: [
    // All standard columns except `deprecated` since we split the list such that there's a dedicated "Deprecated" section.
    'name',
    'description',
    'configsError',
    'configsWarn',
    'configsOff',
    'fixable',
    'hasSuggestions',
    'requiresTypeChecking',
  ],
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
      ...rules.some(([, rule]) => rule.meta.deprecated)
        ? [
          {
            title: 'Deprecated',
            rules: rules.filter(([, rule]) => rule.meta.deprecated),
          }
        ]
        : [],
    ];
  },
  urlRuleDoc(name, page) {
    if (page === 'README.md') {
      // Use URLs only in the README to link to the vitepress SPA. Otherwise, fallback to relative URLs.
      return `https://ota-meshi.github.io/eslint-plugin-regexp/rules/${name}.html`;
    }
  },
};

module.exports = config;
