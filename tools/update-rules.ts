import path from "path"
import fs from "fs"
import os from "os"
// import eslint from "eslint"
import { rules } from "./lib/load-rules"
const isWin = os.platform().startsWith("win")

/**
 * Convert text to camelCase
 */
function camelCase(str: string) {
    return str.replace(/[-_](\w)/gu, (_, c) => (c ? c.toUpperCase() : ""))
}

let content = `
import type { RuleModule } from "../types"
${rules
    .map(
        (rule) =>
            `import ${camelCase(rule.meta.docs.ruleName)} from "../rules/${
                rule.meta.docs.ruleName
            }"`,
    )
    .join("\n")}

export const rules = [
    ${rules.map((rule) => camelCase(rule.meta.docs.ruleName)).join(",")}
] as RuleModule[]
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
