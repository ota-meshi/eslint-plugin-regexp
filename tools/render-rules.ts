import type { RuleModule } from "../lib/types"
import { rules } from "../lib/utils/rules"

//eslint-disable-next-line require-jsdoc
export default function renderRulesTableContent(
    buildRulePath = (ruleName: string) => `./${ruleName}.md`,
) {
    const activeRules = rules.filter((rule) => !rule.meta.deprecated)
    const deprecatedRules = rules.filter((rule) => rule.meta.deprecated)

    // -----------------------------------------------------------------------------

    //eslint-disable-next-line require-jsdoc
    function toRuleRow(rule: RuleModule) {
        const mark = `${rule.meta.docs.recommended ? ":star:" : ""}${
            rule.meta.fixable ? ":wrench:" : ""
        }${rule.meta.deprecated ? ":warning:" : ""}`
        const link = `[${rule.meta.docs.ruleId}](${buildRulePath(
            rule.meta.docs.ruleName || "",
        )})`
        const description = rule.meta.docs.description || "(no description)"

        return `| ${link} | ${description} | ${mark} |`
    }

    //eslint-disable-next-line require-jsdoc
    function toDeprecatedRuleRow(rule: RuleModule) {
        const link = `[${rule.meta.docs.ruleId}](${buildRulePath(
            rule.meta.docs.ruleName || "",
        )})`
        const replacedRules = rule.meta.docs.replacedBy || []
        const replacedBy = replacedRules
            .map((name) => `[regexp/${name}](${buildRulePath(name)}.md)`)
            .join(", ")

        return `| ${link} | ${replacedBy || "(no replacement)"} |`
    }

    // -----------------------------------------------------------------------------
    let rulesTableContent = `
| Rule ID | Description |    |
|:--------|:------------|:---|
${activeRules.map(toRuleRow).join("\n")}
`

    // -----------------------------------------------------------------------------
    if (deprecatedRules.length >= 1) {
        rulesTableContent += `
## Deprecated

- :warning: We're going to remove deprecated rules in the next major release. Please migrate to successor/new rules.
- :innocent: We don't fix bugs which are in deprecated rules since we don't have enough resources.

| Rule ID | Replaced by |
|:--------|:------------|
${deprecatedRules.map(toDeprecatedRuleRow).join("\n")}
`
    }
    return rulesTableContent
}
