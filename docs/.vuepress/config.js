const { rules } = require("../../dist/utils/rules")

function ruleToLink({
    meta: {
        docs: { ruleId, ruleName },
    },
}) {
    return [`/rules/${ruleName}`, ruleId]
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
            resolve: {
                alias: {
                    eslint: require.resolve("eslint4b"),
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
            { text: "Playground", link: "/playground/" },
        ],

        sidebar: {
            "/rules/": [
                "/rules/",
                {
                    title: "Recommended",
                    collapsable: false,
                    children: rules
                        .filter(
                            (rule) =>
                                rule.meta.docs.recommended &&
                                !rule.meta.deprecated
                        )
                        .map(ruleToLink),
                },
                ...(rules.some(
                    (rule) =>
                        !rule.meta.docs.recommended && !rule.meta.deprecated
                )
                    ? [
                          {
                              title: "Uncategorized",
                              collapsable: false,
                              children: rules
                                  .filter(
                                      (rule) =>
                                          !rule.meta.docs.recommended &&
                                          !rule.meta.deprecated
                                  )
                                  .map(ruleToLink),
                          },
                      ]
                    : []),

                // Rules in no category.
                ...(rules.some((rule) => rule.meta.deprecated)
                    ? [
                          {
                              title: "Deprecated",
                              collapsable: false,
                              children: rules
                                  .filter((rule) => rule.meta.deprecated)
                                  .map(ruleToLink),
                          },
                      ]
                    : []),
            ],
            "/": ["/", "/user-guide/", "/rules/", "/playground/"],
        },
    },
}
