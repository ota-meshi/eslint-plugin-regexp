# Contributing

👍🎉 First off, thanks for taking the time to contribute! 🎉👍

## Reporting bugs

To report a bug, [open an issue][new-issue].

If you are unsure whether something is a bug or not, please [open an issue][new-issue]. Insufficient documentation is also a bug.

## Suggesting new features

New features can be a new rule, anew option for an existing rule, or new functionality for existing rules.

To suggest a new feature, [open an issue][new-issue].

## Making pull requests

(If this is your first pull request on GitHub, checkout [this guide](https://github.com/firstcontributions/first-contributions).)

### Getting started

- This is a TypeScript project. You need to have a recentish version of [Node.js](https://nodejs.org/) and npm installed.
- Install all project and development dependencies by running `npm ci`.
- Test that everything is installed correctly by running `npm test`.

We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to lint and format our code base. They will be automatically installed as dependencies but you might need additional editor plugins for a good IDE experience. We recommend using [VSCode](https://code.visualstudio.com/) together with the [ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) for a great editing experience.

### Creating a new rule

The following steps will walk you through the process of creating a new rule.

1. Run `npm run new <rule-name>`:

    This will automatically create 3 files:

    1. `lib/rules/rule-name.ts` - Implementation + meta information (name, category, short desc, etc.)
    1. `tests/lib/rules/rule-name.ts` - Functional tests
    1. `docs/rules/rule-name.md` - Documentation

    These 3 files contain all the information about your new rule. You only need to touch these 3 files to add your rule.

1. Add meta information:

    Fill in the rule's meta information in the `meta` object. This includes a short description, its category, type, and more.

    Note: Do not set `recommended: true`. This will add your rule to the `regex/recommended` configuration. We view additions to the `regex/recommended` configuration as breaking changes. If you want your rule to be included in the `regex/recommended` configuration in the next major release, leave the generated TODO comment as is.

    Once you added a short description and the category, run `npm run update`. This will update a few generated files to include your rule in the website and more.

1. Implement your rule:

    The `createVisitor` function will be where you implement your rule. The `regexpContext` object contains information and methods that you will need for static analysis, reporting, and fixing. Use `messageId`s for report and suggestion messages.

    The [`no-empty-capturing-group`](./lib/rules/no-empty-capturing-group.ts) and [`no-octal`](./lib/rules/no-octal.ts) rules are good examples to see how we usually implement rules.

1. Test your rule:

    Add test for every feature and option of your rule. (We use [ESLint's `RuleTester`](https://eslint.org/docs/developer-guide/nodejs-api#ruletester) for testing rules.)

    Use `npm test` to run all tests.

1. Document your rule:

    The documentation should contain a description of the rule and the problem it detects/solves, examples, all features, all options, and any additional information relevant to the rule.

    You can view the documentation live in your browser by running `npm run docs:watch`. The live view will automatically update when you make changes to the documentation. However, you have to re-load the browser to see changes to the rule implementation.

### Updating documentation

Almost all Markdown files of our website and the project `README.md` are partially or completely generated.

The following files are completely generated and must not be modified directly:

- `docs/index.md` - change this section of the project `README.md` instead.
- `docs/rules/index.md`
- `docs/user-guide/index.md` - change this section of the project `README.md` instead.

The following files are partially generated:

- `README.md`: The rules table is generated.
- `docs/rules/*.md`: Everything above the ":book: Rule Details" heading and below the ":mag: Implementation" heading is generated.

Only change the non-generated parts in these files.

After you changed the documentation, run `npm run update` to update all generated files. Be sure to always run this command before you commit any documentation changes.

You can view changes to the website locally by running `npm run docs:watch`.

### Testing

Aside from `npm test`, there are also a few other ways to manually test new features, changes, and new rules.

1. `npm run docs:watch`:

    The documentation page of each rule includes interactive examples. You can also use your local version of [the playground](https://ota-meshi.github.io/eslint-plugin-regexp/playground/) to for testing.

1. Test your rule and the whole plugin by installing it.

    If there is a project/code base you want to test your rule/the entire plugin on, then installing this project will be the right solution.

    [Setup ESLint](https://eslint.org/docs/user-guide/getting-started) in the target project. Instead of installing the `eslint-plugin-regexp` from the npm registry, install your local `eslint-plugin-regexp` project using the relative path to the project.

    Example:

    ```plaintext
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

[new-issue]: https://github.com/ota-meshi/eslint-plugin-regexp/issues/new/choose
