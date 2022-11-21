import type { DefaultTheme } from "vitepress"
import { defineConfig } from "vitepress"
import { BUNDLED_LANGUAGES } from "shiki"
import path from "path"
import { fileURLToPath } from "url"
import { rules } from "../../lib/utils/rules"
import type { RuleModule } from "../../lib/types"

// Pre-build cjs packages that cannot be bundled well.
import "./build-system/build"

const dirname = path.dirname(
    fileURLToPath(
        // @ts-expect-error -- Cannot change `module` option
        import.meta.url,
    ),
)

// Include `json5` as alias for jsonc
const jsonc = BUNDLED_LANGUAGES.find((lang) => lang.id === "jsonc")
if (jsonc) jsonc.aliases = [...(jsonc?.aliases ?? []), "json5"]

function ruleToSidebarItem({
    meta: {
        docs: { ruleId, ruleName },
    },
}: RuleModule): DefaultTheme.SidebarItem {
    return {
        text: ruleId,
        link: `/rules/${ruleName}`,
    }
}

const categories = {
    "Best Practices": [] as RuleModule[],
    "Possible Errors": [] as RuleModule[],
    "Stylistic Issues": [] as RuleModule[],
    deprecated: [] as RuleModule[],
}

for (const rule of rules) {
    if (rule.meta.deprecated) {
        categories.deprecated.push(rule)
    } else {
        categories[rule.meta.docs.category].push(rule)
    }
}

export default defineConfig({
    base: "/eslint-plugin-regexp/",
    title: "eslint-plugin-regexp",
    outDir: path.join(dirname, "./dist/eslint-plugin-regexp"),
    description:
        "ESLint plugin for finding RegExp mistakes and RegExp style guide violations.",

    vite: {
        resolve: {
            alias: {
                eslint: path.join(dirname, "./build-system/shim/eslint.mjs"),
                path: path.join(dirname, "./build-system/shim/path.mjs"),
            },
        },
    },

    lastUpdated: true,
    themeConfig: {
        editLink: {
            pattern:
                "https://github.com/ota-meshi/eslint-plugin-regexp/edit/master/docs/:path",
        },
        nav: [
            { text: "Introduction", link: "/" },
            { text: "User Guide", link: "/user-guide/" },
            { text: "Rules", link: "/rules/" },
            { text: "Settings", link: "/settings/" },
            { text: "Playground", link: "/playground/" },
        ],
        socialLinks: [
            {
                icon: "github",
                link: "https://github.com/ota-meshi/eslint-plugin-regexp",
            },
        ],
        sidebar: {
            "/rules/": [
                {
                    text: "Rules",
                    items: [{ text: "Available Rules", link: "/rules/" }],
                },
                {
                    text: "Possible Errors",
                    collapsible: false,
                    items: categories["Possible Errors"].map(ruleToSidebarItem),
                },
                {
                    text: "Best Practices",
                    collapsible: false,
                    items: categories["Best Practices"].map(ruleToSidebarItem),
                },
                {
                    text: "Stylistic Issues",
                    collapsible: false,
                    items: categories["Stylistic Issues"].map(
                        ruleToSidebarItem,
                    ),
                },
                ...(categories.deprecated.length >= 1
                    ? [
                          {
                              text: "Deprecated",
                              collapsible: false,
                              items: categories.deprecated.map(
                                  ruleToSidebarItem,
                              ),
                          },
                      ]
                    : []),
            ],
            "/": [
                {
                    text: "Guide",
                    items: [
                        { text: "Introduction", link: "/" },
                        { text: "User Guide", link: "/user-guide/" },
                        { text: "Rules", link: "/rules/" },
                        { text: "Settings", link: "/settings/" },
                    ],
                },
            ],
        },
    },
})
