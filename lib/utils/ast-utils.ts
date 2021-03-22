import type { Rule } from "eslint"
import * as eslintUtils from "eslint-utils"
import type {
    CallExpression,
    Expression,
    Identifier,
    Literal,
    MemberExpression,
    MethodDefinition,
    Property,
} from "estree"
import { parseStringLiteral } from "./string-literal-parser"
import { baseParseReplacements } from "./replacements-utils"
import type { Scope, Variable } from "eslint-scope"

/**
 * Find the variable of a given name.
 */
export function findVariable(
    context: Rule.RuleContext,
    node: Identifier,
): Variable | null {
    return eslintUtils.findVariable(getScope(context, node), node)
}

/**
 * Gets the scope for the current node
 */
export function getScope(
    context: Rule.RuleContext,
    currentNode: Identifier | Property | MemberExpression | MethodDefinition,
): Scope {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    const scopeManager = (context.getSourceCode() as any).scopeManager

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    let node: any = currentNode
    for (; node; node = node.parent || null) {
        const scope = scopeManager.acquire(node, false)

        if (scope) {
            if (scope.type === "function-expression-name") {
                return scope.childScopes[0]
            }
            return scope
        }
    }

    return scopeManager.scopes[0]
}

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
