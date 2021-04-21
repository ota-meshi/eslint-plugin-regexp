"use strict"

const { rules } = require("eslint-plugin-regexp")

const enableAllRules = Object.keys(rules)
    .map((name) => `regexp/${name}`)
    .reduce((p, c) => {
        p[c] = "error"
        return p
    }, {})

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
        // eslint-disable-next-line node/no-unsupported-features/es-syntax -- Lint only
        ...enableAllRules,
        "require-jsdoc": "error",
        "no-warning-comments": "warn",
        "no-lonely-if": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-duplicate-imports": "error",

        "no-shadow": "off", // ts bug?
        "@typescript-eslint/no-shadow": "error",

        // Rules for implementing this plugin.
        "no-restricted-imports": [
            "error",
            {
                paths: [
                    {
                        name: "regexp-ast-analysis",
                        importNames: ["toCharSet"],
                        message:
                            "Please use toCharSet from RegExpContext instead.",
                    },
                ],
            },
        ],

        "no-empty-character-class": "error",

        "regexp/no-dupe-disjunctions": ["error", { disallowNeverMatch: true }],
        "regexp/letter-case": [
            "error",
            { hexadecimalEscape: "lowercase", controlEscape: "uppercase" },
        ],
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
