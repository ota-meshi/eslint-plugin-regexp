import eslint from "eslint"

export = {
    plugins: ["regexp"],
    rules: {
        // ESLint core rules
        "no-control-regex": "error",
        "no-invalid-regexp": "error",
        "no-misleading-character-class": "error",
        "no-regex-spaces": "error",
        "prefer-regex-literals": "error",
        // If ESLint is 7 or higher, use core rule. If it is 6 or less, use the copied rule.
        [parseInt(eslint.Linter?.version?.[0] ?? "6", 10) >= 7
            ? "no-useless-backreference"
            : "regexp/no-useless-backreference"]: "error",

        // eslint-plugin-regexp rules
        "regexp/match-any": "error",
        "regexp/no-assertion-capturing-group": "error",
        "regexp/no-dupe-characters-character-class": "error",
        "regexp/no-empty-group": "error",
        "regexp/no-empty-lookarounds-assertion": "error",
        "regexp/no-escape-backspace": "error",
        "regexp/no-invisible-character": "error",
        "regexp/no-octal": "error",
        "regexp/no-useless-exactly-quantifier": "error",
        "regexp/no-useless-two-nums-quantifier": "error",
        "regexp/prefer-d": "error",
        "regexp/prefer-plus-quantifier": "error",
        "regexp/prefer-question-quantifier": "error",
        "regexp/prefer-star-quantifier": "error",
        "regexp/prefer-t": "error",
        "regexp/prefer-w": "error",
    },
}
