import path from "path"
import fs from "fs"
import os from "os"
import renderRulesTableContent from "./render-rules"
const isWin = os.platform().startsWith("win")

let insertText = `\n${renderRulesTableContent(
    (name) =>
        `https://ota-meshi.github.io/eslint-plugin-regexp/rules/${name}.html`,
)}\n`
if (isWin) {
    insertText = insertText
        .replace(/\r?\n/gu, "\n")
        .replace(/\r/gu, "\n")
        .replace(/\n/gu, "\r\n")
}

const readmeFilePath = path.resolve(__dirname, "../README.md")
const newReadme = fs
    .readFileSync(readmeFilePath, "utf8")
    .replace(
        /<!--RULES_TABLE_START-->[\s\S]*<!--RULES_TABLE_END-->/u,
        `<!--RULES_TABLE_START-->${insertText.replace(
            /\$/g,
            "$$$$",
        )}<!--RULES_TABLE_END-->`,
    )
fs.writeFileSync(readmeFilePath, newReadme)

const docsReadmeFilePath = path.resolve(__dirname, "../docs/README.md")

fs.writeFileSync(
    docsReadmeFilePath,
    newReadme
        .replace("# eslint-plugin-regexp\n", "# Introduction\n")
        .replace(
            /<!--RULES_SECTION_START-->[\s\S]*<!--RULES_SECTION_END-->/u,
            "See [Available Rules](./rules/README.md).",
        )
        .replace(
            /<!--USAGE_SECTION_START-->[\s\S]*<!--USAGE_SECTION_END-->/u,
            "See [User Guide](./user-guide/README.md).",
        )
        .replace(/<!--DOCS_IGNORE_START-->[\s\S]*?<!--DOCS_IGNORE_END-->/gu, "")
        .replace(
            /\(https:\/\/ota-meshi.github.io\/eslint-plugin-regexp/gu,
            "(.",
        )
        .replace(/\n{3,}/gu, "\n\n"),
)
