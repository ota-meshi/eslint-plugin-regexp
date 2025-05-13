import path from "node:path"
import { fileURLToPath } from "node:url"
import { fixupConfigRules } from "@eslint/compat"
import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import myPlugin from "@ota-meshi/eslint-plugin"
import regexp from "eslint-plugin-regexp"
import unicorn from "eslint-plugin-unicorn"
import tseslint from "typescript-eslint"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
})

export default [
    {
        ignores: [
            ".nyc_output/",
            "coverage/",
            "dist/",
            "docs/.vitepress/dist/",
            "docs/.vitepress/build-system/shim/eslint.mjs",
            "docs/.vitepress/cache/",
            "node_modules/",
            "assets/",
            "!docs/.vitepress/",
            "!.vscode/",
            "!.github/",
            "tests/fixtures/integrations/eslint-plugin/test.js",
            "tests/fixtures/integrations/eslint-plugin-legacy-config/test.js",
            "docs/rules/**/*.md/*.js",
            ".github/ISSUE_TEMPLATE/new_rule_request.md",
        ],
    },
    js.configs.recommended,
    regexp.configs["flat/recommended"],
    ...myPlugin.config({
        node: true,
        ts: true,
        eslintPlugin: true,
        json: true,
        yaml: true,
        prettier: true,
        vue3: true,
        md: true,
    }),
    ...fixupConfigRules(compat.extends("plugin:import/recommended")),
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "script",
        },
        rules: {
            "jsdoc/require-jsdoc": "off",
            "no-warning-comments": "warn",
            "no-lonely-if": "off",
            complexity: "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "no-shadow": "off",

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

            "import/order": [
                "warn",
                {
                    alphabetize: {
                        order: "asc",
                    },
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
        settings: {
            "import/resolver": {
                typescript: true,
                node: true,
            },
        },
    },
    {
        files: ["**/*.mjs", "**/*.md/*.js"],
        languageOptions: {
            sourceType: "module",
        },
    },
    {
        files: ["**/*.{ts,mts}"],
        languageOptions: {
            sourceType: "module",
            parserOptions: {
                project: true,
            },
        },
        rules: {
            "no-implicit-globals": "off",
            "@typescript-eslint/naming-convention": "off",
            "@typescript-eslint/no-shadow": "error",
        },
    },
    {
        files: ["lib/rules/**"],
        rules: {
            "eslint-plugin/report-message-format": [
                "error",
                String.raw`[^a-z].*\.$`,
            ],
        },
    },
    {
        files: ["tools/**/*.ts", "tests/**/*.ts"],
        rules: {
            "jsdoc/require-jsdoc": "off",
            "no-console": "off",
            "n/file-extension-in-import": "off",
            "n/no-unsupported-features/node-builtins": "off",
        },
    },
    {
        files: ["tests/**/*.ts"],
        rules: Object.keys(regexp.rules)
            .map((name) => `regexp/${name}`)
            .reduce((p, c) => {
                p[c] = "off"
                return p
            }, {}),
    },
    ...tseslint.config({
        files: ["**/*.vue"],
        extends: [tseslint.configs.disableTypeChecked],
        languageOptions: {
            globals: {
                require: true,
            },
            parserOptions: {
                project: null,
            },
        },
        rules: {
            "vue/multi-word-component-names": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "import/named": "off",
            "import/no-unresolved": "off",
        },
    }),
    {
        files: ["docs/.vitepress/**/*.{js,mjs,ts,mts,vue}"],
        languageOptions: {
            globals: {
                window: true,
                require: true,
            },
            sourceType: "module",
        },
        rules: {
            "jsdoc/require-jsdoc": "off",
            "n/file-extension-in-import": "off",
            "n/no-extraneous-import": "off",
            "n/no-unsupported-features/es-syntax": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "import/export": "off",
            "import/namespace": "off",
            "import/default": "off",
            "import/no-named-as-default": "off",
            "import/no-named-as-default-member": "off",
        },
    },
    {
        files: ["tests/fixtures/integrations/eslint-plugin/eslint.config.mjs"],
        rules: {
            "import/no-unresolved": "off",
            "n/no-missing-import": "off",
        },
    },
    {
        ignores: ["lib/**/*", "**/*.json"],
        plugins: { unicorn },
        rules: {
            "unicorn/prefer-string-raw": "error",
        },
    },
]
