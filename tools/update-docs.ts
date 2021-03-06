import path from "path"
import fs from "fs"
import { rules } from "../lib/utils/rules"
import type { RuleModule } from "../lib/types"

//eslint-disable-next-line require-jsdoc -- tools
function formatItems(items: string[]) {
    if (items.length <= 2) {
        return items.join(" and ")
    }
    return `all of ${items.slice(0, -1).join(", ")} and ${
        items[items.length - 1]
    }`
}

//eslint-disable-next-line require-jsdoc -- tools
function yamlValue(val: unknown) {
    if (typeof val === "string") {
        return `"${val.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"')}"`
    }
    return val
}

const ROOT = path.resolve(__dirname, "../docs/rules")

//eslint-disable-next-line require-jsdoc -- tools
function pickSince(content: string): string | null {
    const fileIntro = /^---\n(.*\n)+---\n*/g.exec(content)
    if (fileIntro) {
        const since = /since: "?(v\d+\.\d+\.\d+)"?/.exec(fileIntro[0])
        if (since) {
            return since[1]
        }
    }
    // eslint-disable-next-line no-process-env -- ignore
    if (process.env.IN_VERSION_SCRIPT) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- ignore
        return `v${require("../package.json").version}`
    }
    return null
}

class DocFile {
    private readonly rule: RuleModule

    private readonly filePath: string

    private content: string

    private readonly since: string | null

    public constructor(rule: RuleModule) {
        this.rule = rule
        this.filePath = path.join(ROOT, `${rule.meta.docs.ruleName}.md`)
        this.content = fs.readFileSync(this.filePath, "utf8")
        this.since = pickSince(this.content)
    }

    public static read(rule: RuleModule) {
        return new DocFile(rule)
    }

    public updateHeader() {
        const {
            meta: {
                fixable,
                deprecated,
                docs: { ruleId, description, recommended, replacedBy },
            },
        } = this.rule
        const title = `# ${ruleId}\n\n> ${description}`
        const notes = []

        if (deprecated) {
            if (replacedBy) {
                const replacedRules = replacedBy.map(
                    (name) => `[regexp/${name}](${name}.md) rule`,
                )
                notes.push(
                    `- :warning: This rule was **deprecated** and replaced by ${formatItems(
                        replacedRules,
                    )}.`,
                )
            } else {
                notes.push("- :warning: This rule was **deprecated**.")
            }
        } else {
            if (recommended) {
                notes.push(
                    '- :gear: This rule is included in `"plugin:regexp/recommended"`.',
                )
            }
        }
        if (fixable) {
            notes.push(
                "- :wrench: The `--fix` option on the [command line](https://eslint.org/docs/user-guide/command-line-interface#fixing-problems) can automatically fix some of the problems reported by this rule.",
            )
        }
        if (!this.since) {
            notes.unshift(
                `- :exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>`,
            )
        }

        // Add an empty line after notes.
        if (notes.length >= 1) {
            notes.push("", "")
        }

        const headerPattern = /(?:^|\n)#.+\n+[^\n]*\n+(?:- .+\n+)*\n*/u

        const header = `\n${title}\n\n${notes.join("\n")}`
        if (headerPattern.test(this.content)) {
            this.content = this.content.replace(headerPattern, header)
        } else {
            this.content = `${header}${this.content.trim()}\n`
        }

        return this
    }

    public updateFooter() {
        const { ruleName } = this.rule.meta.docs
        const footerPattern = /## (?:(?::mag:)? ?Implementation|:rocket: Version).+$/s
        const footer = `${
            this.since
                ? `## :rocket: Version

This rule was introduced in eslint-plugin-regexp ${this.since}

`
                : ""
        }## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/${ruleName}.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/${ruleName}.ts)
`
        if (footerPattern.test(this.content)) {
            this.content = this.content.replace(footerPattern, footer)
        } else {
            this.content = `${this.content.trim()}\n\n${footer}`
        }

        return this
    }

    public updateCodeBlocks() {
        const { meta } = this.rule

        this.content = this.content.replace(
            /<eslint-code-block(.*?)>/gu,
            (_t, str) => {
                const ps = str
                    .split(/\s+/u)
                    .map((s: string) => s.trim())
                    .filter((s: string) => s && s !== "fix")
                if (meta.fixable) {
                    ps.unshift("fix")
                }
                ps.unshift("<eslint-code-block")
                return `${ps.join(" ")}>`
            },
        )
        return this
    }

    public adjustCodeBlocks() {
        // Adjust the necessary blank lines before and after the code block so that GitHub can recognize `.md`.
        this.content = this.content.replace(
            /(<eslint-code-block([\s\S]*?)>)\n+```/gmu,
            "$1\n\n```",
        )
        this.content = this.content.replace(
            /```\n+<\/eslint-code-block>/gmu,
            "```\n\n</eslint-code-block>",
        )
        return this
    }

    public updateFileIntro() {
        const { ruleId, description } = this.rule.meta.docs

        const fileIntro = {
            pageClass: "rule-details",
            sidebarDepth: 0,
            title: ruleId,
            description,
            ...(this.since ? { since: this.since } : {}),
        }
        const computed = `---\n${Object.keys(fileIntro)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tool
            .map((key) => `${key}: ${yamlValue((fileIntro as any)[key])}`)
            .join("\n")}\n---\n`

        const fileIntroPattern = /^---\n(.*\n)+?---\n*/gu

        if (fileIntroPattern.test(this.content)) {
            this.content = this.content.replace(fileIntroPattern, computed)
        } else {
            this.content = `${computed}${this.content.trim()}\n`
        }

        return this
    }

    public write() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- tools
        const isWin = require("os").platform().startsWith("win")

        this.content = this.content.replace(/\r?\n/gu, isWin ? "\r\n" : "\n")

        fs.writeFileSync(this.filePath, this.content)
    }
}

for (const rule of rules) {
    DocFile.read(rule)
        .updateHeader()
        .updateFooter()
        .updateCodeBlocks()
        .updateFileIntro()
        .adjustCodeBlocks()
        .write()
}
