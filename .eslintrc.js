"use strict"

// const version = require("./package.json").version

module.exports = {
    parserOptions: {
        sourceType: "script",
        ecmaVersion: 2020,
    },
    extends: [
        "plugin:@ota-meshi/recommended",
        "plugin:@ota-meshi/+node",
        "plugin:@ota-meshi/+typescript",
        "plugin:@ota-meshi/+eslint-plugin",
        "plugin:@ota-meshi/+json",
        "plugin:@ota-meshi/+yaml",
        // "plugin:@ota-meshi/+md",
        "plugin:@ota-meshi/+prettier",
    ],
    rules: {
        "require-jsdoc": "error",
        "no-warning-comments": "warn",
        "no-lonely-if": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-duplicate-imports": "error",

        "no-shadow": "off", // ts bug?
        "@typescript-eslint/no-shadow": "error",

        // https://github.com/ota-meshi/eslint-plugin-regexp/pull/49
        "no-empty-character-class": "error",
        "regexp/negation": "error",
        "regexp/no-dupe-disjunctions": "error",
        "regexp/no-useless-character-class": "error",
        "regexp/no-useless-escape": "error",
        "regexp/no-useless-non-capturing-group": "error",
        "regexp/no-useless-non-greedy": "error",
        "regexp/no-useless-range": "error",
        "regexp/prefer-character-class": "error",
        "regexp/prefer-range": "error",
        "regexp/prefer-unicode-codepoint-escapes": "error",

        "regexp/letter-case": [
            "error",
            { hexadecimalEscape: "lowercase", controlEscape: "uppercase" },
        ],

        // others
        "regexp/order-in-character-class": "error",
        "regexp/prefer-quantifier": "error",
        "regexp/prefer-regexp-exec": "error",
        "regexp/prefer-regexp-test": "error",
    },
    overrides: [
        {
            files: ["*.ts"],
            parser: "@typescript-eslint/parser",
            parserOptions: {
                sourceType: "module",
                project: "./tsconfig.json",
            },
            rules: {
                "no-implicit-globals": "off",
                "@typescript-eslint/naming-convention": [
                    "error",
                    {
                        selector: "default",
                        format: ["camelCase"],
                        leadingUnderscore: "allow",
                        trailingUnderscore: "allow",
                    },
                    {
                        selector: "variable",
                        format: ["camelCase", "UPPER_CASE"],
                        leadingUnderscore: "allow",
                        trailingUnderscore: "allow",
                    },
                    {
                        selector: "typeLike",
                        format: ["PascalCase"],
                    },
                    {
                        selector: "property",
                        format: ["camelCase", "UPPER_CASE", "PascalCase"],
                    },
                    {
                        selector: "method",
                        format: ["camelCase", "UPPER_CASE", "PascalCase"],
                    },
                ],
            },
        },
        {
            files: ["lib/rules/**"],
            rules: {
                "eslint-plugin/report-message-format": [
                    "error",
                    "[^a-z].*\\.$",
                ],
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
            extends: ["plugin:@ota-meshi/+vue2", "plugin:@ota-meshi/+prettier"],
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
            },
            globals: {
                window: true,
            },
            rules: {
                "require-jsdoc": "off",
            },
        },
    ],
}
