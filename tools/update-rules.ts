import path from "path"
import fs from "fs"
import os from "os"
// import eslint from "eslint"
import { rules } from "./lib/load-rules"
const isWin = os.platform().startsWith("win")

let content = `
import type { RuleModule } from "../types"

export const rules = [
    ${rules
        .map((rule) => `require("../rules/${rule.meta.docs.ruleName}"),`)
        .join("")}
] as RuleModule[]

/**
 * Get recommended config
 */
export function recommendedConfig(): { [key: string]: "error" | "warn" } {
    return rules.reduce((obj, rule) => {
        if (!rule.meta.deprecated) {
            obj[rule.meta.docs.ruleId] = rule.meta.docs.default || "error"
        }
        return obj
    }, {} as { [key: string]: "error" | "warn" })
}
`

const filePath = path.resolve(__dirname, "../lib/utils/rules.ts")

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
