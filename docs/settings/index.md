# Settings

[Shared settings](https://eslint.org/docs/user-guide/configuring/configuration-files#adding-shared-settings) are a way to configure multiple rules at once.

## :book: Usage

All settings for this plugin use the `regexp` namespace.

Example **.eslintrc.js**:

```js
module.exports = {
  ..., // rules, plugins, etc.

  settings: {
    // all settings for this plugin have to be in the `regexp` namespace
    regexp: {
      // define settings here, such as:
      // allowedCharacterRanges: 'all'
    }
  }
}
```

## :gear: Available settings

### `allowedCharacterRanges`

Defines a set of allowed character ranges. Rules will only allow, create, and fix character ranges defined here.

#### Values

The following values are allowed:

- `"alphanumeric"`

  This will allow only alphanumeric ranges (`0-9`, `A-Z`, and `a-z`). Only ASCII character are included.

- `"all"`

  This will allow only all ranges (roughly equivalent to `"\x00-\uFFFF"`).

- `"<min>-<max>"`

  A custom range that allows all character from `<min>` to `<max>`. Both `<min>` and `<max>` have to be single Unicode code points.

  E.g. `"A-Z"` (U+0041 - U+005A), `"а-я"` (U+0430 - U+044F), `"😀-😏"` (U+1F600 - U+1F60F).

- A non-empty array of the string values mentioned above. All ranges of the array items will be allowed.

#### Default

If the setting isn't defined, its value defaults to `"alphanumeric"`.

#### Example

```js
module.exports = {
  ..., // rules, plugins, etc.
  settings: {
    regexp: {
      // allow alphanumeric and cyrillic ranges
      allowedCharacterRanges: ['alphanumeric', 'а-я', 'А-Я']
    }
  }
}
```

#### Affected rules

- [regexp/no-obscure-range]
- [regexp/prefer-range]

[regexp/no-obscure-range]: ../rules/no-obscure-range.md
[regexp/prefer-range]: ../rules/prefer-range.md
