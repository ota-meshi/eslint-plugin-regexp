import path from "path"
import fs from "fs"
import { rules } from "../lib/utils/rules"
import type { RuleModule } from "../lib/types"
import { getNewVersion } from "./lib/changesets-util"

//eslint-disable-next-line require-jsdoc -- tools
function yamlValue(val: unknown) {
    if (typeof val === "string") {
        return `"${val.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"')}"`
    }
    return val
}

const ROOT = path.resolve(__dirname, "../docs/rules")

//eslint-disable-next-line require-jsdoc -- tools
function pickSince(content: string): string | null | Promise<string> {
    const fileIntro = /^---\n(?<content>.*\n)+---\n*/u.exec(content)
    if (fileIntro) {
        const since = /since: "?(?<version>v\d+\.\d+\.\d+)"?/u.exec(
            fileIntro.groups!.content,
        )
        if (since) {
            return since.groups!.version
        }
    }
    // eslint-disable-next-line no-process-env -- ignore
    if (process.env.IN_VERSION_SCRIPT) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports -- ignore
        return `v${require("../package.json").version}`
    }
    // eslint-disable-next-line no-process-env -- ignore
    if (process.env.IN_VERSION_CI_SCRIPT) {
        return getNewVersion().then((v) => `v${v}`)
    }
    return null
}

class DocFile {
    private readonly rule: RuleModule

    private readonly filePath: string

    private content: string

    private readonly since: string | null | Promise<string>

    public constructor(rule: RuleModule) {
        this.rule = rule
        this.filePath = path.join(ROOT, `${rule.meta.docs.ruleName}.md`)
        this.content = fs.readFileSync(this.filePath, "utf8")
        this.since = pickSince(this.content)
    }

    public static read(rule: RuleModule) {
        return new DocFile(rule)
    }

    public async updateFooter() {
        const since = await this.since
        const { ruleName } = this.rule.meta.docs
        const footerPattern =
            /## (?:(?::mag:)? ?Implementation|:rocket: Version).+$/su
        const footer = `## :rocket: Version

${
    since
        ? `This rule was introduced in eslint-plugin-regexp ${since}`
        : `:exclamation: <badge text="This rule has not been released yet." vertical="middle" type="error"> ***This rule has not been released yet.*** </badge>`
}

## :mag: Implementation

- [Rule source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/lib/rules/${ruleName}.ts)
- [Test source](https://github.com/ota-meshi/eslint-plugin-regexp/blob/master/tests/lib/rules/${ruleName}.ts)
`
        if (footerPattern.test(this.content)) {
            this.content = this.content.replace(
                footerPattern,
                footer.replace(/\$/gu, "$$$$"),
            )
        } else {
            this.content = `${this.content.trim()}\n\n${footer}`
        }

        return this
    }

    public updateCodeBlocks() {
        const { meta } = this.rule

        this.content = this.content.replace(
            /<eslint-code-block(?<attrs>.*?)>/gu,
            (_t, attrs) => {
                const ps = attrs
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
            /(?<startTag><eslint-code-block[\s\S]*?>)\n+```/gu,
            "$<startTag>\n\n```",
        )
        this.content = this.content.replace(
            /```\n+<\/eslint-code-block>/gu,
            "```\n\n</eslint-code-block>",
        )
        return this
    }

    public async updateFileIntro() {
        const since = await this.since
        const { ruleId, description } = this.rule.meta.docs

        const fileIntro = {
            pageClass: "rule-details",
            sidebarDepth: 0,
            title: ruleId,
            description,
            ...(since ? { since } : {}),
        }
        const computed = `---\n${Object.keys(fileIntro)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tool
            .map((key) => `${key}: ${yamlValue((fileIntro as any)[key])}`)
            .join("\n")}\n---\n`

        const fileIntroPattern = /^---\n(?:.*\n)+?---\n*/gu

        if (fileIntroPattern.test(this.content)) {
            this.content = this.content.replace(
                fileIntroPattern,
                computed.replace(/\$/gu, "$$$$"),
            )
        } else {
            this.content = `${computed}${this.content.trim()}\n`
        }

        return this
    }

    public updateHeaderDescription() {
        const { description } = this.rule.meta.docs

        this.content = this.content.replace(
            // eslint-disable-next-line regexp/no-super-linear-move -- ignore
            /\n+> [^\n]*\n+##\s[^\n]+Rule Details/u,
            `

> ${description.replace(/\$/gu, "$$$$")}

## :book: Rule Details`,
        )

        return this
    }

    public write() {
        this.content = this.content.replace(/\r?\n/gu, "\n")

        fs.writeFileSync(this.filePath, this.content)
    }
}

void main()

/** main */
async function main() {
    for (const rule of rules) {
        const doc = DocFile.read(rule)
        await doc.updateFooter()
        doc.updateCodeBlocks()
        await doc.updateFileIntro()
        doc.updateHeaderDescription()
        doc.adjustCodeBlocks()
        doc.write()
    }
}
