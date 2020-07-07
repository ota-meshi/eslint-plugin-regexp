# User Guide

## Installation

```bash
npm install --save-dev eslint eslint-plugin-regexp
```

::: tip Requirements
- ESLint v6.0.0 and above
- Node.js v8.10.0 and above
:::

## Usage

### Configuration

Use `.eslintrc.*` file to configure rules. See also: [https://eslint.org/docs/user-guide/configuring](https://eslint.org/docs/user-guide/configuring).

Example **.eslintrc.js**:

```js
module.exports = {
  extends: [
    // add more generic rulesets here, such as:
    // 'eslint:recommended',
    'plugin:regexp/recommended'
  ],
  rules: {
    // override/add rules settings here, such as:
    // 'regexp/no-dupe-characters-character-class': 'error'
  }
}
```

This plugin provides one config:

- `plugin:regexp/recommended` ... This is the recommended configuration for this plugin.  
  See [lib/configs/recommended.ts](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/configs/recommended.ts) for details.

See [the rule list](../rules/README.md) to get the `rules` that this plugin provides.
