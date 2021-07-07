import path from "path"
import fs from "fs"
import renderRulesTableContent from "./render-rules"

const insertText = `\n${renderRulesTableContent(
    (name) =>
        `https://ota-meshi.github.io/eslint-plugin-regexp/rules/${name}.html`,
)}\n`

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
            // eslint-disable-next-line regexp/no-super-linear-backtracking -- it's acceptable here
            /\(https:\/\/ota-meshi.github.io\/eslint-plugin-regexp(.*?)([^/]*\.html)?\)/gu,
            (_ptn, c1: string, c2: string) => {
                let result = `(.${c1}`
                if (c2) {
                    result +=
                        c2 === "index.html"
                            ? "README.md"
                            : c2.replace(/\.html$/, ".md")
                } else {
                    result += "README.md"
                }
                result += ")"
                return result
            },
        )
        .replace(/\n{3,}/gu, "\n\n"),
)

const userGuideReadmeFilePath = path.resolve(
    __dirname,
    "../docs/user-guide/README.md",
)
const newUserGuideReadme = fs
    .readFileSync(userGuideReadmeFilePath, "utf8")
    .replace(
        /<!--USAGE_SECTION_START-->[\s\S]*<!--USAGE_SECTION_END-->/u,
        /<!--USAGE_SECTION_START-->[\s\S]*<!--USAGE_SECTION_END-->/u.exec(
            newReadme,
        )![0],
    )

fs.writeFileSync(
    userGuideReadmeFilePath,
    newUserGuideReadme
        .replace(/\(#white_check_mark-rules\)/g, "(../rules/README.md)")
        .replace(/\n{3,}/gu, "\n\n"),
)
