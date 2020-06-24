import type { JSONSchema4 } from "json-schema"
import { Rule } from "eslint"
export interface RuleListener {
    [key: string]: (node: never) => void
}

export interface RuleModule {
    meta: RuleMetaData
    create(context: Rule.RuleContext): RuleListener
}

export interface RuleMetaData {
    docs: {
        description: string
        recommended: boolean
        url: string
        ruleId: string
        ruleName: string
        replacedBy?: []
        default?: "error" | "warn"
    }
    messages: { [messageId: string]: string }
    fixable?: "code" | "whitespace"
    schema: JSONSchema4 | JSONSchema4[]
    deprecated?: boolean
    type: "problem" | "suggestion" | "layout"
}

export interface PartialRuleModule {
    meta: PartialRuleMetaData
    create(context: Rule.RuleContext): RuleListener
}

export interface PartialRuleMetaData {
    docs: {
        description: string
        recommended: boolean
        replacedBy?: []
        default?: "error" | "warn"
    }
    messages: { [messageId: string]: string }
    fixable?: "code" | "whitespace"
    schema: JSONSchema4 | JSONSchema4[]
    deprecated?: boolean
    type: "problem" | "suggestion" | "layout"
}
