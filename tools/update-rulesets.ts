import path from "path"
import fs from "fs"
import os from "os"
// import eslint from "eslint"
import { rules } from "./lib/load-rules"
const isWin = os.platform().startsWith("win")

const coreRules = [
    // Possible Errors
    "no-control-regex",
    // TODO In the major version
    // "no-empty-character-class",
    "no-invalid-regexp",
    "no-misleading-character-class",
    "no-regex-spaces",
    // Best Practices
    // "prefer-named-capture-group", // modern
    "prefer-regex-literals",
    // "require-unicode-regexp", // modern
]

let content = `
import eslint from "eslint"

export = {
    plugins: ["regexp"],
    rules: {
        // ESLint core rules
        ${coreRules.map((ruleName) => `"${ruleName}": "error"`).join(",\n")},
        // If ESLint is 7 or higher, use core rule. If it is 6 or less, use the copied rule.
        [parseInt(eslint.Linter?.version?.[0] ?? "6", 10) >= 7
            ? "no-useless-backreference"
            : "regexp/no-useless-backreference"]: "error",

        // eslint-plugin-regexp rules
        ${rules
            .filter(
                (rule) => rule.meta.docs.recommended && !rule.meta.deprecated,
            )
            .map((rule) => {
                const conf = rule.meta.docs.default || "error"
                return `"${rule.meta.docs.ruleId}": "${conf}"`
            })
            .join(",\n")}
    },
}
`

const filePath = path.resolve(__dirname, "../lib/configs/recommended.ts")

if (isWin) {
    content = content
        .replace(/\r?\n/gu, "\n")
        .replace(/\r/gu, "\n")
        .replace(/\n/gu, "\r\n")
}

// Update file.
fs.writeFileSync(filePath, content)

// Format files.
// const linter = new eslint.CLIEngine({ fix: true })
// const report = linter.executeOnFiles([filePath])
// eslint.CLIEngine.outputFixes(report)
