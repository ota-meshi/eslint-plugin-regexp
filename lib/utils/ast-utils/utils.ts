import type { Rule } from "eslint"
import * as eslintUtils from "eslint-utils"
import type {
    ArrowFunctionExpression,
    CallExpression,
    Expression,
    FunctionDeclaration,
    FunctionExpression,
    Identifier,
    Literal,
    MemberExpression,
    Node,
} from "estree"
import { parseStringLiteral } from "../string-literal-parser"
import { baseParseReplacements } from "../replacements-utils"
import type { Scope, Variable } from "eslint-scope"

/**
 * Get a parent node
 * The AST node used by ESLint always has a `parent`, but since there is no `parent` on Types, use this function.
 */
export function getParent<E extends Node>(node: Node | null): E | null {
    if (!node) {
        return null
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    return (node as any).parent
}

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
 * Get the value of a given node if it's a constant of string.
 */
export function getStringIfConstant(
    context: Rule.RuleContext,
    node: Node,
): string | null {
    // Supports `regexp.source` that eslint-utils#getStringIfConstant does not track.
    if (
        node.type === "BinaryExpression" ||
        node.type === "MemberExpression" ||
        node.type === "Identifier" ||
        node.type === "TemplateLiteral"
    ) {
        const evaluated = getStaticValue(context, node)
        return evaluated && String(evaluated.value)
    }
    return eslintUtils.getStringIfConstant(node, getScope(context, node))
}

type GetStaticValueResult =
    | { value: unknown }
    | { value: undefined; optional?: true }

/* eslint-disable complexity -- ignore */
/**
 * Get the value of a given node if it's a static value.
 */
export function getStaticValue(
    /* eslint-enable complexity -- ignore */
    context: Rule.RuleContext,
    node: Node,
): GetStaticValueResult | null {
    // Supports `regexp.source` that eslint-utils#getStaticValue does not track.
    if (node.type === "BinaryExpression") {
        if (node.operator === "+") {
            const left = getStaticValue(context, node.left)
            if (left == null) {
                return null
            }
            const right = getStaticValue(context, node.right)
            if (right == null) {
                return null
            }
            return {
                value:
                    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-explicit-any -- ignore
                    (left.value as any) + right.value,
            }
        }
    } else if (node.type === "MemberExpression") {
        const propName: string | null = !node.computed
            ? (node.property as Identifier).name
            : getStringIfConstant(context, node.property)
        if (propName === "source") {
            const object = getStaticValue(context, node.object)
            if (object && object.value instanceof RegExp) {
                return { value: object.value.source }
            }
        }
    } else if (node.type === "TemplateLiteral") {
        const expressions: GetStaticValueResult[] = []

        for (const expr of node.expressions) {
            const exprValue = getStaticValue(context, expr)
            if (!exprValue) {
                return null
            }
            expressions.push(exprValue)
        }
        let value = node.quasis[0].value.cooked
        for (let i = 0; i < expressions.length; ++i) {
            value += String(expressions[i].value)
            value += node.quasis[i + 1].value.cooked!
        }
        return { value }
    } else if (node.type === "Identifier") {
        const variable = findVariable(context, node)

        if (variable != null && variable.defs.length === 1) {
            const def = variable.defs[0]
            if (
                def.type === "Variable" &&
                def.parent &&
                def.parent.type === "VariableDeclaration" &&
                def.parent.kind === "const" &&
                def.node.id.type === "Identifier" &&
                def.node.init
            ) {
                return getStaticValue(context, def.node.init)
            }
        }
    }
    return eslintUtils.getStaticValue(node, getScope(context, node))
}

/**
 * Gets the scope for the current node
 */
export function getScope(context: Rule.RuleContext, currentNode: Node): Scope {
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
 * Find function node
 */
export function findFunction(
    context: Rule.RuleContext,
    id: Identifier,
): FunctionDeclaration | FunctionExpression | ArrowFunctionExpression | null {
    let target = id

    const set = new Set<Identifier>()
    for (;;) {
        if (set.has(target)) {
            return null
        }
        set.add(target)
        const calleeVariable = findVariable(context, target)
        if (!calleeVariable) {
            return null
        }
        if (calleeVariable.defs.length === 1) {
            const def = calleeVariable.defs[0]
            if (def.node.type === "FunctionDeclaration") {
                return def.node
            }
            if (
                def.type === "Variable" &&
                def.parent.kind === "const" &&
                def.node.init
            ) {
                if (
                    def.node.init.type === "FunctionExpression" ||
                    def.node.init.type === "ArrowFunctionExpression"
                ) {
                    return def.node.init
                }
                if (def.node.init.type === "Identifier") {
                    target = def.node.init
                    continue
                }
            }
        }
        return null
    }
}

export type KnownMethodCall = CallExpression & {
    callee: MemberExpression & { object: Expression; property: Identifier }
    arguments: Expression[]
}
/**
 * Checks whether given node is expected method call
 */
export function isKnownMethodCall(
    node: CallExpression,
    methods: Record<string, number>,
): node is KnownMethodCall {
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
