type RemovedRule = {
    ruleName: string
    replacedBy: string[]
    removedInVersion: string
    latestDocUrl: string
}

export const removedRules: RemovedRule[] = [
    {
        ruleName: "no-assertion-capturing-group",
        replacedBy: ["no-empty-capturing-group"],
        removedInVersion: "v2.0.0",
        get latestDocUrl(): string {
            return `https://github.com/ota-meshi/eslint-plugin-regexp/blob/v1.15.0/docs/rules/${this.ruleName}.md`
        },
    },
    {
        ruleName: "no-useless-exactly-quantifier",
        replacedBy: ["no-useless-quantifier", "no-zero-quantifier"],
        removedInVersion: "v2.0.0",
        get latestDocUrl(): string {
            return `https://github.com/ota-meshi/eslint-plugin-regexp/blob/v1.15.0/docs/rules/${this.ruleName}.md`
        },
    },
    {
        ruleName: "no-useless-non-greedy",
        replacedBy: ["no-useless-lazy"],
        removedInVersion: "v2.0.0",
        get latestDocUrl(): string {
            return `https://github.com/ota-meshi/eslint-plugin-regexp/blob/v1.15.0/docs/rules/${this.ruleName}.md`
        },
    },
    {
        ruleName: "order-in-character-class",
        replacedBy: ["sort-character-class-elements"],
        removedInVersion: "v2.0.0",
        get latestDocUrl(): string {
            return `https://github.com/ota-meshi/eslint-plugin-regexp/blob/v1.15.0/docs/rules/${this.ruleName}.md`
        },
    },
    {
        ruleName: "prefer-t",
        replacedBy: ["control-character-escape"],
        removedInVersion: "v2.0.0",
        get latestDocUrl(): string {
            return `https://github.com/ota-meshi/eslint-plugin-regexp/blob/v1.15.0/docs/rules/${this.ruleName}.md`
        },
    },
]

export function getRemovedTable(options: { headerLevel: number }): string {
    return `
${"#".repeat(options.headerLevel)} Removed

- :no_entry: These rules have been removed in a previous major release, after they have been deprecated for a while.

| Rule ID | Replaced by | Removed in version |
|:--------|:------------|:-------------------|
${removedRules
    .map((rule) => {
        const replacement =
            rule.replacedBy
                .map((name) => `[regexp/${name}](./${name}.md)`)
                .join(", ") || "(no replacement)"
        return `| [${rule.ruleName}](${rule.latestDocUrl}) | ${replacement} | ${rule.removedInVersion} |`
    })
    .join("\n")}
`.trim()
}
