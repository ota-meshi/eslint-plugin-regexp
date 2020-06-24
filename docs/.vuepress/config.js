const { rules } = require("../../dist/utils/rules")

const deprecatedRules = rules.filter((rule) => rule.meta.deprecated)

const extraCategories = []
if (deprecatedRules.length > 0) {
    extraCategories.push({
        title: "Deprecated",
        collapsable: false,
        children: deprecatedRules.map(
            ({
                meta: {
                    docs: { ruleId, ruleName },
                },
            }) => [`/rules/${ruleName}`, ruleId]
        ),
    })
}

module.exports = {
    base: "/eslint-plugin-regexp/",
    title: "eslint-plugin-regexp",
    description:
        "ESLint plugin for finding RegExp mistakes and RegExp style guide violations.",
    serviceWorker: true,
    evergreen: true,
    configureWebpack(_config, _isServer) {
        return {}
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
            { text: "Playground", link: "/playground/" },
        ],

        sidebar: {
            "/rules/": [
                "/rules/",
                {
                    title: "Rules",
                    collapsable: false,
                    children: rules.map(
                        ({
                            meta: {
                                docs: { ruleId, ruleName },
                            },
                        }) => [`/rules/${ruleName}`, ruleId]
                    ),
                },

                // Rules in no category.
                ...extraCategories,
            ],
            "/": ["/", "/user-guide/", "/rules/", "/playground/"],
        },
    },
}
