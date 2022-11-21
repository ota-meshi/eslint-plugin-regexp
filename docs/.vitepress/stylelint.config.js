module.exports = {
    extends: ["stylelint-config-standard-vue"],
    rules: {
        "no-descending-specificity": null,
        "selector-class-pattern": null,
        "value-keyword-case": null,

        // Conflict with Prettier
        indentation: null,
    },
}
