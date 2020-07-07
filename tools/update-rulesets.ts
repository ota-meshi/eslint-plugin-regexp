import path from "path"
import fs from "fs"
import os from "os"
// import eslint from "eslint"
import { rules } from "./lib/load-rules"
const isWin = os.platform().startsWith("win")

const coreRules = [
    "no-control-regex",
    "no-invalid-regexp",
    "no-misleading-character-class",
    "no-regex-spaces",
    "no-useless-backreference",
    "prefer-regex-literals",
    // "prefer-named-capture-group", // modern
    // "require-unicode-regexp", // modern
]

let content = `
export default {
    plugins: ["regexp"],
    rules: {
        // ESLint core rules
        ${coreRules.map((ruleName) => `"${ruleName}": "error"`).join(",\n")},

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
