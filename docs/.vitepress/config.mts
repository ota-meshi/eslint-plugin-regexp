import path from "node:path"
import { fileURLToPath } from "node:url"
import MagicString from "magic-string"
import eslint4b from "vite-plugin-eslint4b"
import type { DefaultTheme, Plugin } from "vitepress"
import { defineConfig } from "vitepress"
import { rules } from "../../lib/all-rules.js"
import type { RuleModule } from "../../lib/types.js"

const dirname = path.dirname(fileURLToPath(import.meta.url))

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

/**
 * Load TypeScript on docs playground
 * 
 * This plugin replaces imports from `"node:module"` with a typescript load implementation.
 * `ts-util.ts` uses `node:module` to load TypeScript dynamically, but VitePress's bundling
 * process cannot handle it properly on the browser, so we need to replace it.
 * 
 * NOTE:
 * When typescript native (a.k.a `tsgo`) release near future, we might need to find out another way.
 * Maybe we need to use `tsgo` wasm build or something else.
 */
function loadTypeScriptPlugin(): Plugin {
    return {
        name: "vite-plugin-load-typescript",
        transform(code, id) {
            if (id.endsWith("ts-util.ts")) {
                const ast = this.parse(code)
                const s = new MagicString(code)
                for (const node of ast.body) {
                    if (
                        node.type === "ImportDeclaration" &&
                        node.source?.value === "node:module"
                    ) {
                        const importedName =
                            node.specifiers?.[0]?.local?.name ?? "module"
                        s.overwrite(
                            (node as unknown as { start: number }).start,
                            (node as unknown as { end: number }).end,
                            `import { default as typescript } from 'typescript';
const ${importedName} = {
  createRequire: () => (id) => {
    if (id === "typescript") {
      return typescript;
    } else {
      const err = new Error("Module not found");
      err.code = "MODULE_NOT_FOUND";
      throw err;
    }
  }
};`,
                        )
                    }
                }

                return {
                    code: s.toString(),
                    map: s.generateMap({ hires: true }),
                }
            }
            return null
        },
    }
}

export default defineConfig({
    base: "/eslint-plugin-regexp/",
    title: "eslint-plugin-regexp",
    outDir: path.join(dirname, "./dist/eslint-plugin-regexp"),
    description:
        "ESLint plugin for finding RegExp mistakes and RegExp style guide violations.",

    vite: {
        plugins: [eslint4b(), loadTypeScriptPlugin()],
        define: {
            "process.env.NODE_DEBUG": "false",
            "process.platform": JSON.stringify(process.platform),
            "process.version": JSON.stringify(process.version),
        },
    },

    lastUpdated: true,
    themeConfig: {
        search: {
            provider: "local",
            options: {
                detailedView: true,
            },
        },
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
                    collapsed: false,
                    items: categories["Possible Errors"].map(ruleToSidebarItem),
                },
                {
                    text: "Best Practices",
                    collapsed: false,
                    items: categories["Best Practices"].map(ruleToSidebarItem),
                },
                {
                    text: "Stylistic Issues",
                    collapsed: false,
                    items: categories["Stylistic Issues"].map(
                        ruleToSidebarItem,
                    ),
                },
                ...(categories.deprecated.length >= 1
                    ? [
                          {
                              text: "Deprecated",
                              collapsed: false,
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
