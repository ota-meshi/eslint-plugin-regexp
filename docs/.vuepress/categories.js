const { rules } = require("../../dist/utils/rules")

const categoryTitles = {
    base: "Base Rules (Enabling Plugin)",
    recommended: "Recommended",
}

const categoryConfigDescriptions = {
    base: "Enable this plugin using with:",
    recommended: "Enforce all the rules in this category with:",
}

const categoryIds = Object.keys(categoryTitles)
const categoryRules = rules.reduce((obj, rule) => {
    const cat = rule.meta.docs.category || "uncategorized"
    const categories = obj[cat] || (obj[cat] = [])
    categories.push(rule)
    return obj
}, {})

// Throw if no title is defined for a category
for (const categoryId of Object.keys(categoryRules)) {
    if (categoryId !== "uncategorized" && !categoryTitles[categoryId]) {
        throw new Error(
            `Category "${categoryId}" does not have a title defined.`
        )
    }
}

module.exports = categoryIds.map((categoryId) => ({
    categoryId,
    title: categoryTitles[categoryId],
    configDescription: categoryConfigDescriptions[categoryId],
    rules: (categoryRules[categoryId] || []).filter(
        (rule) => !rule.meta.deprecated
    ),
}))
// .filter(category => category.rules.length >= 1)
