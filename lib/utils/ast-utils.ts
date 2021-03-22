import type { Rule } from "eslint"
import type {
    CallExpression,
    Expression,
    Identifier,
    Literal,
    MemberExpression,
} from "estree"
import { parseStringLiteral } from "./string-literal-parser"
import { baseParseReplacements } from "./replacements-utils"

/**
 * Checks whether given node is expected method call
 */
export function isKnownMethodCall(
    node: CallExpression,
    methods: Record<string, number>,
): node is CallExpression & {
    callee: MemberExpression & { object: Expression; property: Identifier }
    arguments: Expression[]
} {
    const mem = node.callee
    if (
        mem.type !== "MemberExpression" ||
        mem.computed ||
        mem.property.type !== "Identifier"
    ) {
        return false
    }
    const argLength = methods[mem.property.name]
    if (node.arguments.length !== argLength) {
        return false
    }
    if (node.arguments.some((arg) => arg.type === "SpreadElement")) {
        return false
    }
    const object = mem.object
    if (object.type === "Super") {
        return false
    }

    return true
}

interface BaseElement {
    type: string
    range: [number, number]
}
export type ReplacementElement =
    | CharacterElement
    | DollarElement
    | ReferenceElement
export interface CharacterElement extends BaseElement {
    type: "CharacterElement"
    value: string
}
export interface DollarElement extends BaseElement {
    type: "DollarElement"
    kind: "$" | "&" | "`" | "'"
}
// $1, $<name>
export interface ReferenceElement extends BaseElement {
    type: "ReferenceElement"
    ref: number | string
    refText: string
}

/**
 * Parse replacements string
 */
export function parseReplacements(
    context: Rule.RuleContext,
    node: Literal,
): ReplacementElement[] {
    const stringLiteral = parseStringLiteral(context.getSourceCode().text, {
        start: node.range![0],
        end: node.range![1],
    })
    const tokens = stringLiteral.tokens.filter((t) => t.value)

    return baseParseReplacements(tokens, (start, end) => {
        return {
            range: [start.range[0], end.range[1]],
        }
    })
}
