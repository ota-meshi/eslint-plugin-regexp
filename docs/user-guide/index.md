# User Guide

## :cd: Installation

```bash
npm install --save-dev eslint eslint-plugin-regexp
```

::: tip Requirements

- ESLint v8.44.0 and above
- Node.js v18.x, v20.x and above

:::

## :book: Usage

<!--USAGE_SECTION_START-->

Add `regexp` to the plugins section of your `eslint.config.js` or `.eslintrc` configuration file (you can omit the `eslint-plugin-` prefix)
and either use one of the two configurations available (`recommended` or `all`) or configure the rules you want:

### The recommended configuration (New Config)

The `plugin.configs["flat/recommended"]` config enables a subset of [the rules](../rules/index.md) that should be most useful to most users.
*See [lib/configs/rules/recommended.ts](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/configs/rules/recommended.ts) for more details.*

```js
// eslint.config.js
import * as regexpPlugin from "eslint-plugin-regexp"

export default [
    regexpPlugin.configs["flat/recommended"],
];
```

### The recommended configuration (Legacy Config)

The `plugin:regexp/recommended` config enables a subset of [the rules](../rules/index.md) that should be most useful to most users.
*See [lib/configs/rules/recommended.ts](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/configs/rules/recommended.ts) for more details.*

```js
// .eslintrc.js
module.exports = {
    "plugins": [
        "regexp"
    ],
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
// eslint.config.js
import * as regexpPlugin from "eslint-plugin-regexp"

export default [
    {
        plugins: { regexp: regexpPlugin }
        rules: {
            // Override/add rules settings here, such as:
            "regexp/rule-name": "error"
        }
    }
];
```

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

### Using the all configuration

The `plugin.configs["flat/all"]` / `plugin:regexp/all` config enables all rules. It's meant for testing, not for production use because it changes with every minor and major version of the plugin. Use it at your own risk.
*See [lib/configs/rules/all.ts](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/configs/rules/all.ts) for more details.*

<!--USAGE_SECTION_END-->

See [the rule list](../rules/index.md) to get the `rules` that this plugin provides.

Some rules also support [shared settings](../settings/index.md).
