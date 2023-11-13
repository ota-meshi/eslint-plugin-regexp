import { Linter } from "eslint"
import { rules } from "../../../../../lib/utils/rules.ts"
import { rules as recommendedRules } from "../../../../../lib/configs/recommended.ts"

const coreRules = Object.fromEntries(new Linter().getRules())

const CATEGORY_TITLES = {
    "Possible Errors": "Possible Errors",
    "Best Practices": "Best Practices",
    "Stylistic Issues": "Stylistic Issues",
    "eslint-core-rules@problem": "ESLint core rules(Possible Errors)",
    "eslint-core-rules@suggestion": "ESLint core rules(Suggestions)",
    "eslint-core-rules@layout": "ESLint core rules(Layout & Formatting)",
}
const CATEGORY_INDEX = {
    "Possible Errors": 1,
    "Best Practices": 2,
    "Stylistic Issues": 3,
    "eslint-core-rules@problem": 20,
    "eslint-core-rules@suggestion": 21,
    "eslint-core-rules@layout": 22,
}
const CATEGORY_CLASSES = {
    base: "eslint-plugin-regexp-category",
    "Possible Errors": "eslint-plugin-regexp-category",
    "Best Practices": "eslint-plugin-regexp-category",
    "Stylistic Issues": "eslint-plugin-regexp-category",
    "eslint-core-rules@problem": "eslint-core-category",
    "eslint-core-rules@suggestion": "eslint-core-category",
    "eslint-core-rules@layout": "eslint-core-category",
}

const allRules = []

for (const k of Object.keys(rules)) {
    const rule = rules[k]
    if (rule.meta.deprecated) {
        continue
    }
    allRules.push({
        classes: "eslint-plugin-regexp-rule",
        category: rule.meta.docs.category,
        ruleId: rule.meta.docs.ruleId,
        url: rule.meta.docs.url,
        init: "error",
    })
}
for (const k of Object.keys(coreRules)) {
    const rule = coreRules[k]
    if (rule.meta.deprecated) {
        continue
    }
    allRules.push({
        classes: "eslint-core-rule",
        category: `eslint-core-rules@${rule.meta.type}`,
        ruleId: k,
        url: rule.meta.docs.url,
        init: recommendedRules[k] || "off",
    })
}

allRules.sort((a, b) =>
    a.ruleId > b.ruleId ? 1 : a.ruleId < b.ruleId ? -1 : 0,
)

export const categories = []

for (const rule of allRules) {
    const title = CATEGORY_TITLES[rule.category]
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
    c[r.ruleId] = r.init
    return c
}, {})

export { allRules as rules }

export function getRule(ruleId) {
    if (!ruleId) {
        return null
    }
    for (const category of categories) {
        for (const rule of category.rules) {
            if (rule.ruleId === ruleId) {
                return rule
            }
        }
    }
    return {
        ruleId,
        url: "",
        classes: "",
    }
}
