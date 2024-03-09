"use strict"

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
        "plugin:regexp/recommended",
    ],
    rules: {
        "require-jsdoc": "off",
        "no-warning-comments": "warn",
        "no-lonely-if": "off",
        complexity: "off",
        "@typescript-eslint/no-non-null-assertion": "off",

        "no-shadow": "off",
        "@typescript-eslint/no-shadow": "error",
        // Repo rule
        "no-restricted-imports": [
            "error",
            {
                patterns: [
                    {
                        group: ["/regexpp", "/regexpp/*"],
                        message:
                            "Please use `@eslint-community/regexpp` instead.",
                    },
                    {
                        group: ["/eslint-utils", "/eslint-utils/*"],
                        message:
                            "Please use `@eslint-community/eslint-utils` instead.",
                    },
                ],
            },
        ],
        // See https://eslint.org/blog/2023/09/preparing-custom-rules-eslint-v9/
        "no-restricted-properties": [
            "error",
            {
                object: "context",
                property: "getSourceCode",
                message: "Please use `context.sourceCode` instead.",
            },
            {
                object: "context",
                property: "getFilename",
                message: "Please use `context.filename` instead.",
            },
            {
                object: "context",
                property: "getCwd",
                message: "Please use `context.cwd` instead.",
            },
            {
                object: "context",
                property: "getScope",
                message: "Please use `sourceCode.getScope(node)` instead.",
            },
            {
                object: "context",
                property: "parserServices",
                message: "Please use `sourceCode.parserServices` instead.",
            },
        ],

        // regexp next recommended
        "regexp/no-contradiction-with-assertion": "error",
        "regexp/no-empty-character-class": "error",
        "regexp/no-misleading-unicode-character": "error",
        "regexp/use-ignore-case": "error",

        // regexp Possible Errors
        "regexp/no-super-linear-move": "error",
        // regexp Best Practices
        "regexp/no-octal": "error",
        "regexp/no-standalone-backslash": "error",
        "regexp/prefer-escape-replacement-dollar-char": "error",
        "regexp/prefer-quantifier": "error",
        "regexp/prefer-regexp-exec": "error",
        "regexp/prefer-regexp-test": "error",
        "regexp/require-unicode-regexp": "error",
        "regexp/sort-alternatives": "error",
        // regexp Stylistic Issues
        "regexp/hexadecimal-escape": "error",
        "regexp/letter-case": "error",
        "regexp/prefer-named-backreference": "error",
        "regexp/prefer-named-capture-group": "error",
        "regexp/prefer-named-replacement": "error",
        "regexp/prefer-result-array-groups": "error",
        "regexp/sort-character-class-elements": "error",
        "regexp/unicode-escape": "error",
    },
    overrides: [
        {
            files: ["*.mjs"],
            parserOptions: {
                sourceType: "module",
            },
        },
        {
            files: ["*.ts"],
            parser: "@typescript-eslint/parser",
            parserOptions: {
                sourceType: "module",
                project: "./tsconfig.json",
            },
            rules: {
                "no-implicit-globals": "off",
                "@typescript-eslint/naming-convention": "off",
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
                "n/file-extension-in-import": "off",
            },
        },
        {
            files: ["*.vue"],
            extends: ["plugin:@ota-meshi/+vue3", "plugin:@ota-meshi/+prettier"],
            parserOptions: {
                sourceType: "module",
            },
            globals: {
                require: true,
            },
            rules: {
                "vue/multi-word-component-names": "off",
                "@typescript-eslint/no-explicit-any": "off",
            },
        },
        {
            files: ["docs/.vitepress/**"],
            parserOptions: {
                sourceType: "module",
                ecmaVersion: 2020,
            },
            globals: {
                window: true,
                require: true,
            },
            rules: {
                "require-jsdoc": "off",
                "n/file-extension-in-import": "off",
                "n/no-extraneous-import": "off",
                "n/no-unsupported-features/es-syntax": "off",
                "@typescript-eslint/no-explicit-any": "off",
            },
        },
    ],
}
