const path = require("path")
const { rules } = require("../../dist/utils/rules")

function ruleToLink({
    meta: {
        docs: { ruleId, ruleName },
    },
}) {
    return [`/rules/${ruleName}`, ruleId]
}

/** @type {Record<import("../../lib/types").RuleCategory | "deprecated", import("../../lib/types").RuleModule[]>} */
const categories = {
    "Best Practices": [],
    "Possible Errors": [],
    "Stylistic Issues": [],
    deprecated: [],
}

for (const rule of rules) {
    if (rule.meta.deprecated) {
        categories.deprecated.push(rule)
    } else {
        categories[rule.meta.docs.category].push(rule)
    }
}

module.exports = {
    base: "/eslint-plugin-regexp/",
    title: "eslint-plugin-regexp",
    description:
        "ESLint plugin for finding RegExp mistakes and RegExp style guide violations.",
    serviceWorker: true,
    evergreen: true,
    configureWebpack(_config, _isServer) {
        return {
            externals: {
                typescript: "typescript",
            },
            resolve: {
                alias: {
                    esquery: path.resolve(
                        __dirname,
                        "../../node_modules/esquery/dist/esquery.min.js",
                    ),
                    "@eslint/eslintrc/universal": path.resolve(
                        __dirname,
                        "../../node_modules/@eslint/eslintrc/dist/eslintrc-universal.cjs",
                    ),
                },
            },
        }
    },

    head: [
        // ["link", { rel: "icon", type: "image/png", href: "/logo.png" }]
    ],
    themeConfig: {
        // logo: "/logo.svg",
        repo: "ota-meshi/eslint-plugin-regexp",
        docsRepo: "ota-meshi/eslint-plugin-regexp",
        docsDir: "docs",
        docsBranch: "master",
        editLinks: true,
        lastUpdated: true,
        serviceWorker: {
            updatePopup: true,
        },

        nav: [
            { text: "Introduction", link: "/" },
            { text: "User Guide", link: "/user-guide/" },
            { text: "Rules", link: "/rules/" },
            { text: "Settings", link: "/settings/" },
            { text: "Playground", link: "/playground/" },
        ],

        sidebar: {
            "/rules/": [
                "/rules/",
                {
                    title: "Possible Errors",
                    collapsable: false,
                    children: categories["Possible Errors"].map(ruleToLink),
                },
                {
                    title: "Best Practices",
                    collapsable: false,
                    children: categories["Best Practices"].map(ruleToLink),
                },
                {
                    title: "Stylistic Issues",
                    collapsable: false,
                    children: categories["Stylistic Issues"].map(ruleToLink),
                },
                ...(categories.deprecated.length >= 1
                    ? [
                          {
                              title: "Deprecated",
                              collapsable: false,
                              children: categories.deprecated.map(ruleToLink),
                          },
                      ]
                    : []),
            ],
            "/": ["/", "/user-guide/", "/rules/", "/settings/", "/playground/"],
        },
    },
}
