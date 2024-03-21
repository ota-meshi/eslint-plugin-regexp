import fs from "fs"
import path from "path"
// import eslint from "eslint"
import { rules } from "./lib/load-rules"

/**
 * Convert text to camelCase
 */
function camelCase(str: string) {
    return str.replace(/[-_](?<char>\w)/gu, (_, char) => char.toUpperCase())
}

const content = `import type { RuleModule } from "./types"
${rules
    .map(
        (rule) =>
            `import ${camelCase(rule.meta.docs.ruleName)} from "./rules/${
                rule.meta.docs.ruleName
            }"`,
    )
    .join("\n")}

export const rules: RuleModule[] = [
    ${rules.map((rule) => camelCase(rule.meta.docs.ruleName)).join(",\n    ")},
]
`

const filePath = path.resolve(__dirname, "../lib/all-rules.ts")

// Update file.
fs.writeFileSync(filePath, content)

// Format files.
// const linter = new eslint.CLIEngine({ fix: true })
// const report = linter.executeOnFiles([filePath])
// eslint.CLIEngine.outputFixes(report)
