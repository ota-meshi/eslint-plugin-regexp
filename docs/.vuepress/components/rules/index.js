// eslint-disable-next-line eslint-comments/disable-enable-pair -- demo
/* eslint-disable node/no-unsupported-features/es-syntax -- demo */
import * as coreRules from "../../../../node_modules/eslint4b/dist/core-rules"
import plugin from "../../../../"

const CATEGORY_TITLES = {
    "Possible Errors": "Possible Errors",
    "Best Practices": "Best Practices",
    "Stylistic Issues": "Stylistic Issues",
    "eslint-core-rules@Possible Errors": "ESLint core rules(Possible Errors)",
    "eslint-core-rules@Best Practices": "ESLint core rules(Best Practices)",
    "eslint-core-rules@Strict Mode": "ESLint core rules(Strict Mode)",
    "eslint-core-rules@Variables": "ESLint core rules(Variables)",
    "eslint-core-rules@Node.js and CommonJS":
        "ESLint core rules(Node.js and CommonJS)",
    "eslint-core-rules@Stylistic Issues": "ESLint core rules(Stylistic Issues)",
    "eslint-core-rules@ECMAScript 6": "ESLint core rules(ECMAScript 6)",
}
const CATEGORY_INDEX = {
    "Possible Errors": 1,
    "Best Practices": 2,
    "Stylistic Issues": 3,
    "eslint-plugin-vue": 10,
    "eslint-core-rules@Possible Errors": 20,
    "eslint-core-rules@Best Practices": 21,
    "eslint-core-rules@Strict Mode": 22,
    "eslint-core-rules@Variables": 23,
    "eslint-core-rules@Node.js and CommonJS": 24,
    "eslint-core-rules@Stylistic Issues": 25,
    "eslint-core-rules@ECMAScript 6": 26,
}
const CATEGORY_CLASSES = {
    base: "eslint-plugin-regexp__category",
    "Possible Errors": "eslint-plugin-regexp__category",
    "Best Practices": "eslint-plugin-regexp__category",
    "Stylistic Issues": "eslint-plugin-regexp__category",
}

const allRules = []

for (const k of Object.keys(plugin.rules)) {
    const rule = plugin.rules[k]
    if (rule.meta.deprecated) {
        continue
    }
    allRules.push({
        classes: "eslint-plugin-regexp__rule",
        category: rule.meta.docs.category,
        ruleId: rule.meta.docs.ruleId,
        url: rule.meta.docs.url,
        init: "error", // CATEGORY_INDEX[rule.meta.docs.category] <= 3,
    })
}
for (const k of Object.keys(coreRules)) {
    const rule = coreRules[k]
    allRules.push({
        category: `eslint-core-rules@${rule.meta.docs.category}`,
        fallbackTitle: `ESLint core rules(${rule.meta.docs.category})`,
        ruleId: k,
        url: rule.meta.docs.url,
        init: plugin.configs.recommended.rules[k] || "off",
    })
}

allRules.sort((a, b) =>
    a.ruleId > b.ruleId ? 1 : a.ruleId < b.ruleId ? -1 : 0,
)

export const categories = []

for (const rule of allRules) {
    const title = CATEGORY_TITLES[rule.category] || rule.fallbackTitle
    let category = categories.find((c) => c.title === title)
    if (!category) {
        category = {
            classes: CATEGORY_CLASSES[rule.category],
            category: rule.category,
            categoryOrder: CATEGORY_INDEX[rule.category],
            title,
            rules: [],
        }
        categories.push(category)
    }
    category.rules.push(rule)
}
categories.sort((a, b) =>
    a.categoryOrder > b.categoryOrder
        ? 1
        : a.categoryOrder < b.categoryOrder
        ? -1
        : a.title > b.title
        ? 1
        : a.title < b.title
        ? -1
        : 0,
)

export const DEFAULT_RULES_CONFIG = allRules.reduce((c, r) => {
    if (r.ruleId === "vue/no-parsing-error") {
        c[r.ruleId] = "error"
    } else {
        c[r.ruleId] = r.init
    }
    return c
}, {})

export const rules = allRules
