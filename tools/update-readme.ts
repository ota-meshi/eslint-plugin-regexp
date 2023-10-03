import path from "path"
import fs from "fs"
import { rules } from "./lib/load-rules"

const readmeFilePath = path.resolve(__dirname, "../README.md")
const readme = fs
    .readFileSync(readmeFilePath, "utf8")
    .replace(
        /\d{1,4}plugin rules/u,
        `${rules.filter((rule) => !rule.meta.deprecated).length} plugin rules`,
    )

fs.writeFileSync(readmeFilePath, readme)

const docsReadmeFilePath = path.resolve(__dirname, "../docs/index.md")

fs.writeFileSync(
    docsReadmeFilePath,
    readme
        .replace("# eslint-plugin-regexp\n", "# Introduction\n")
        .replace("<!--PACKAGE_STATUS_START-->", '<div class="package-status">')
        .replace("<!--PACKAGE_STATUS_END-->", "</div>")
        .replace(
            /<!-- begin auto-generated rules list -->[\s\S]*<!-- end auto-generated rules list -->/u,
            "See [Available Rules](./rules/index.md).",
        )
        .replace(
            /<!--USAGE_SECTION_START-->[\s\S]*<!--USAGE_SECTION_END-->/u,
            "See [User Guide](./user-guide/index.md).",
        )
        .replace(/<!--DOCS_IGNORE_START-->[\s\S]*?<!--DOCS_IGNORE_END-->/gu, "")
        .replace(
            // eslint-disable-next-line regexp/no-super-linear-backtracking -- it's acceptable here
            /\(https:\/\/ota-meshi.github.io\/eslint-plugin-regexp(?<paths>.*?)(?<name>[^/]*\.html)?\)/gu,
            (_ptn, paths, name) => {
                let result = `(.${paths}`
                if (name) {
                    result +=
                        name === "index.html"
                            ? "index.md"
                            : name.replace(/\.html$/u, ".md")
                } else {
                    result += "index.md"
                }
                result += ")"
                return result
            },
        )
        .replace(
            "[LICENSE](LICENSE)",
            "[LICENSE](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/LICENSE)",
        )
        .replace(/\n{3,}/gu, "\n\n"),
)

const userGuideReadmeFilePath = path.resolve(
    __dirname,
    "../docs/user-guide/index.md",
)
const newUserGuideReadme = fs
    .readFileSync(userGuideReadmeFilePath, "utf8")
    .replace(
        /<!--USAGE_SECTION_START-->[\s\S]*<!--USAGE_SECTION_END-->/u,
        /<!--USAGE_SECTION_START-->[\s\S]*<!--USAGE_SECTION_END-->/u.exec(
            readme,
        )![0],
    )

fs.writeFileSync(
    userGuideReadmeFilePath,
    newUserGuideReadme
        .replace(/\(#white_check_mark-rules\)/gu, "(../rules/index.md)")
        .replace(/\n{3,}/gu, "\n\n"),
)
