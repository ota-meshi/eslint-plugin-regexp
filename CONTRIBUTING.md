# Contributing

👍🎉 First off, thanks for taking the time to contribute! 🎉👍


## Reporting bugs

To report bugs, [open an issue][new-issue].

If you are unsure whether something is a bug or not, please [open an issue][new-issue]. Insufficient documentation is also a bug.


## Suggesting new features

New features can be new rule, new options for existing rule, and new capabilities for existing rules.

To suggest a new feature, [open an issue][new-issue].


## Making pull requests

If this is your first pull request on GitHub, checkout [this guide](https://github.com/firstcontributions/first-contributions).


### Getting started

- This is a TypeScript project. You need to have a recentish version of [Node.js](https://nodejs.org/) and npm installed.
- Install all project and development dependencies by running `npm ci`.
- Test that everything is installed correctly by running `npm test`.

We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to lint and format our code base. They will automatically installed as dependencies but you might need an editor plugin for a good IDE experience. We recommend using [VSCode](https://code.visualstudio.com/) together with the [ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) for a great editing experience.


### Making a new rule

1.  Run `npm run new rule-name`.

    This will automatically create the necessary files. This includes the source file of the rule itself, a test file, and a documentation Markdown file.

    All created files will automatically be opened in VSCode.

1.  Fill in the rule's meta information in the `meta` object.

    This includes a short description, a category, type, and more.

    The `recommended` property will decide whether the rule will be added to the `regex/recommended` configuration. If set to `true`, your rule will automatically be added to the config, no need to edit anything manually.

    Note: We view additions to the `regex/recommended` configuration as breaking changes. Do not add new rule with `recommended: true`. Instead set it to `false` and add a TODO comment to change it in the next major version.

1.  Implement your rule.

    The generated `lib/rules/rule-name.ts` will include a `createVisitor` function. This is where you will most likely implement your rule. The `regexpContext` object contains information and methods that you will need for static analysis, reporting, and fixing.

    Use `messageId`s for report and suggesting messages.

    The `no-empty-capturing-group` and `no-octal` rules are good examples to see how we usually implement rules.

1.  Test your rule.

    Add tests for every feature of your rule in `tests/lib/rules/rule-name.ts`. Run all tests using `npm test`.

1.  Document your rule.

    Add documentation for your rule into the `docs/rules/rule-name.md` Markdown file. This should include a longer description of the rule, examples, all features, all options, and any additional information relevant to the rule.

    Before you start writing documentation, run `npm run update` once. This will update all (partially) generated files, including the Markdown file of your rule.

    You can view the documentation live in your browser by running `npm run build && npm run docs:watch`. This live view will automatically update when you make changes to the documentation. However, you have to re-run the command to see changes to your rule implementation.


### Updating documentation

Almost all Markdown files of our website and the project `README.md` are partially or completely generated.

The following files are completely generated and should not be modified directly:

- `docs/README.md` - change this section of the project `README.md` instead.
- `docs/rules/README.md`
- `docs/user-guide/README.md` - change this section of the project `README.md` instead.

The following files are partially generated:

- `README.md`: The rules table is generated.
- `docs/rules/*.md`: Everything above the ":book: Rule Details" heading and below the ":mag: Implementation" heading is generated.

All non-generated parts can be modified.

After you changed the documentation, run `npm run update` to update all generated files. Be sure to always run this command before you commit any documentation changes.

You can view your changes to the website locally by running `npm run docs:watch`.


### Testing

Aside from `npm test`, there are also a few other ways to test new features, changes, and new rules.

1.  `npm run build && npm run docs:watch`:

    The documentation page of each rule includes interactive examples. You can also use your local version of [the playground](https://ota-meshi.github.io/eslint-plugin-regexp/playground/) to for testing.

1.  Test your rule and the whole plugin by installing it.

    If there is a project/code base you want to test your rule/the entire plugin on, then installing this project will be the right solution.

    [Setup ESLint](https://eslint.org/docs/user-guide/getting-started) in the target project. Instead of installing the `eslint-plugin-regexp` from the npm registry, install your local `eslint-plugin-regexp` project using the relative path to the project.

    Example:

    ```
    projects/
    ├── target/
    |   └── package.json
    └── eslint-plugin-regexp/
        └── package.json
    ```

    ```console
    projects/target$ npm i -D ../eslint-plugin-regexp
    ```

    Note: If you make changes to the implementation of a rule, you'll have to run `npm run build` before these changes show up in the target project.


<!-- Important links -->

[new-issue]: https://github.com/PrismJS/prism/issues/new/choose
