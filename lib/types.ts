import type { Rule } from "eslint"
import type { JSONSchema4 } from "json-schema"

export type RuleListener = Rule.RuleListener

export interface RuleModule {
    meta: RuleMetaData
    create(context: Rule.RuleContext): RuleListener
}

export type RuleCategory =
    | "Possible Errors"
    | "Best Practices"
    | "Stylistic Issues"

export type SeverityString = "error" | "warn" | "off"

export interface RuleMetaData {
    docs: {
        description: string
        category: RuleCategory
        recommended: boolean
        url: string
        ruleId: string
        ruleName: string
        default?: Exclude<SeverityString, "off">
    }
    messages: { [messageId: string]: string }
    fixable?: "code" | "whitespace"
    schema: JSONSchema4 | JSONSchema4[]
    deprecated?: boolean
    replacedBy?: string[]
    type: "problem" | "suggestion" | "layout"
    hasSuggestions?: boolean
}

export interface PartialRuleModule {
    meta: PartialRuleMetaData
    create: (context: Rule.RuleContext) => RuleListener
}

export interface PartialRuleMetaData {
    docs: {
        description: string
        category: RuleCategory
        recommended: boolean
        default?: Exclude<SeverityString, "off">
    }
    messages: { [messageId: string]: string }
    fixable?: "code" | "whitespace"
    schema: JSONSchema4 | JSONSchema4[]
    deprecated?: boolean
    replacedBy?: string[]
    type: "problem" | "suggestion" | "layout"
    hasSuggestions?: boolean
}

export type RegexpSettings = {
    allowedCharacterRanges?: string | readonly string[]
}
export type ObjectOption = Record<string, never>
