"use strict"

// const version = require("./package.json").version

module.exports = {
    parserOptions: {
        sourceType: "script",
        ecmaVersion: 2020,
    },
    extends: [
        "plugin:@mysticatea/es2015",
        "plugin:@mysticatea/+node",
        "plugin:@mysticatea/+eslint-plugin",
    ],
    rules: {
        "require-jsdoc": "error",
        "no-warning-comments": "warn",
        "no-lonely-if": "off",
        "@mysticatea/ts/ban-ts-ignore": "off",
    },
    overrides: [
        {
            files: ["*.ts"],
            rules: {
                // "@mysticatea/ts/no-require-imports": "off",
                // "@mysticatea/ts/no-var-requires": "off",
                "@mysticatea/node/no-missing-import": "off",
                "no-implicit-globals": "off",
                "@mysticatea/node/no-extraneous-import": "off",
            },
            parserOptions: {
                sourceType: "module",
                project: "./tsconfig.json",
            },
        },
        {
            files: ["lib/rules/**"],
            rules: {
                "@mysticatea/eslint-plugin/report-message-format": [
                    "error",
                    "[^a-z].*\\.$",
                ],
                "@mysticatea/eslint-plugin/require-meta-docs-url": "off",
            },
        },
        {
            files: ["scripts/**/*.ts", "tests/**/*.ts"],
            rules: {
                "require-jsdoc": "off",
                "no-console": "off",
            },
        },
        {
            files: ["*.vue"],
            parserOptions: {
                sourceType: "module",
            },
            globals: {
                require: true,
            },
        },
        {
            files: ["docs/.vuepress/**"],
            parserOptions: {
                sourceType: "module",
                ecmaVersion: 2020,
                parser: "babel-eslint",
            },
            globals: {
                window: true,
            },
            rules: {
                "require-jsdoc": "off",
                "@mysticatea/vue/html-closing-bracket-newline": "off",
                "@mysticatea/vue/max-attributes-per-line": "off",
                "@mysticatea/vue/comma-dangle": "off",
                "@mysticatea/vue/html-indent": "off",
                "@mysticatea/vue/html-self-closing": "off",
                "@mysticatea/node/no-unsupported-features/es-syntax": "off",
                "@mysticatea/node/no-missing-import": "off",
                "@mysticatea/node/no-missing-require": "off",
            },
        },
    ],
}
