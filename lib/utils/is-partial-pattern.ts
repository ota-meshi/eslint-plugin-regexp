import type { Rule } from "eslint"
import type {
    ArrowFunctionExpression,
    Expression,
    FunctionDeclaration,
    FunctionExpression,
    Identifier,
    Literal,
    MemberExpression,
    ObjectPattern,
    Pattern,
} from "estree"
import { findVariable, getParent, getStringIfConstant } from "./ast-utils"

/**
 * Check whether the given expression node is using it only as a partial pattern (uses only `.source`).
 */
export function isPartialPattern(
    node: Expression,
    context: Rule.RuleContext,
): boolean {
    return isPartialPatternForExpression(node, context, new Map())
}

/** Check whether the given expression node is using it only as a partial pattern. */
function isPartialPatternForExpression(
    node: Expression,
    context: Rule.RuleContext,
    alreadyFn: Map<
        FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
        Set<number>
    >,
): boolean {
    const parent = getParent(node)
    if (!parent) {
        return false
    }
    if (parent.type === "MemberExpression") {
        if (parent.object === node) {
            return isPartialPatternForMemberExpression(parent, context)
        }
        // unknown.
        return false
    } else if (parent.type === "AssignmentExpression") {
        if (parent.right === node) {
            return isPartialPatternForESPattern(parent.left, context, alreadyFn)
        }
        return false // unknown
    } else if (parent.type === "VariableDeclarator") {
        if (parent.init === node) {
            return isPartialPatternForESPattern(parent.id, context, alreadyFn)
        }
        return false // unknown
    } else if (parent.type === "CallExpression") {
        const argIndex = parent.arguments.indexOf(node)
        if (argIndex > -1) {
            // `foo(regexp)`
            if (parent.callee.type === "Identifier") {
                const fn = findFunction(context, parent.callee)
                if (fn) {
                    return isPartialPatternForFunctionArgument(
                        fn,
                        argIndex,
                        context,
                        alreadyFn,
                    )
                }
            }
        }
        return false // unknown
    } else if (parent.type === "ChainExpression") {
        return isPartialPatternForExpression(parent, context, alreadyFn)
    }
    return false
}

/** Check whether the given member expression node is using as a partial pattern. */
function isPartialPatternForMemberExpression(
    node: MemberExpression,
    context: Rule.RuleContext,
) {
    const propName: string | null = !node.computed
        ? (node.property as Identifier).name
        : getStringIfConstant(context, node.property)
    return propName === "source"
}

/** Check whether the given pattern node is using it only as a partial pattern. */
function isPartialPatternForESPattern(
    node: Pattern,
    context: Rule.RuleContext,
    alreadyFn: Map<
        FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
        Set<number>
    >,
) {
    if (node.type === "Identifier") {
        // e.g. const foo = regexp
        return isPartialPatternForVariable(node, context, alreadyFn)
    } else if (node.type === "ObjectPattern") {
        return isPartialPatternForObjectPattern(node, context)
    }
    // unknown
    return false
}

/** Check whether the given object pattern node is using as a partial pattern. */
function isPartialPatternForObjectPattern(
    node: ObjectPattern,
    context: Rule.RuleContext,
) {
    for (const prop of node.properties) {
        if (prop.type === "RestElement") {
            continue
        }
        let propName: string | null = null
        if (!prop.computed) {
            propName =
                prop.key.type === "Identifier"
                    ? prop.key.name
                    : String((prop.key as Literal).value)
        } else {
            propName = getStringIfConstant(context, prop.key)
        }
        if (propName === "source") {
            return true
        }
    }
    // unknown
    return false
}

/** Check whether the given variable is using it only as a partial pattern. */
function isPartialPatternForVariable(
    node: Identifier,
    context: Rule.RuleContext,
    alreadyFn: Map<
        FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
        Set<number>
    >,
) {
    const variable = findVariable(context, node)
    if (!variable) {
        return false
    }
    const readReferences = variable.references.filter((ref) => ref.isRead())
    if (!readReferences.length) {
        // unused
        return false
    }
    for (const reference of readReferences) {
        if (
            !isPartialPatternForExpression(
                reference.identifier,
                context,
                alreadyFn,
            )
        ) {
            return false
        }
    }
    return true
}

/** Check whether the given function argument is using it only as a partial pattern. */
function isPartialPatternForFunctionArgument(
    node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
    argIndex: number,
    context: Rule.RuleContext,
    alreadyFn: Map<
        FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
        Set<number>
    >,
) {
    let alreadyIndexes = alreadyFn.get(node)
    if (!alreadyIndexes) {
        alreadyIndexes = new Set()
        alreadyFn.set(node, alreadyIndexes)
    }
    if (alreadyIndexes.has(argIndex)) {
        return false // cannot check
    }
    alreadyIndexes.add(argIndex)
    const argNode = node.params[argIndex]
    if (argNode && argNode.type === "Identifier") {
        return isPartialPatternForVariable(argNode, context, alreadyFn)
    }
    return false // unknown
}

/**
 * Find function node
 */
function findFunction(
    context: Rule.RuleContext,
    id: Identifier,
): FunctionDeclaration | FunctionExpression | ArrowFunctionExpression | null {
    const calleeVariable = findVariable(context, id)
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
                return findFunction(context, def.node.init)
            }
        }
    }
    return null
}
