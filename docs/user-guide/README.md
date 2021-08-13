# User Guide

## :cd: Installation

```bash
npm install --save-dev eslint eslint-plugin-regexp
```

::: tip Requirements

- ESLint v6.0.0 and above
- Node.js v12.x, v14.x and above

:::

## :book: Usage

<!--USAGE_SECTION_START-->

Add `regexp` to the plugins section of your `.eslintrc` configuration file (you can omit the `eslint-plugin-` prefix)
and configure the rules you want or either use one of the two configurations available (`recommended` or `all`):

### The recommended configuration

The `plugin:regexp/recommended` config enables a subset of [the rules](../rules/README.md) that should be most useful to most users.
*See [lib/configs/recommended.ts](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/configs/recommended.ts) for more details.*

```js
// .eslintrc.js
module.exports = {
    "extends": [
         // add more generic rulesets here, such as:
         // 'eslint:recommended',
        "plugin:regexp/recommended"
    ]
}
```

### Advanced Configuration

Override/add specific rules configurations. *See also: [http://eslint.org/docs/user-guide/configuring](http://eslint.org/docs/user-guide/configuring)*.

```js
// .eslintrc.js
module.exports = {
    "plugins": [
        "regexp"
    ],
    "rules": {
        // Override/add rules settings here, such as:
        "regexp/rule-name": "error"
    }
}
```

### Using `"plugin:regexp/all"`

The `plugin:regexp/all` config enables all rules. It's meant for testing, not for production use because it changes with every minor and major version of the plugin. Use it at your own risk.
*See [lib/configs/all.ts](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/configs/all.ts) for more details.*

<!--USAGE_SECTION_END-->

See [the rule list](../rules/README.md) to get the `rules` that this plugin provides.

Some rules also support [shared settings](../settings/README.md).
