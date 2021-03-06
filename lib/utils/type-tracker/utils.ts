// eslint-disable-next-line eslint-comments/disable-enable-pair -- ignore
/* eslint-disable @typescript-eslint/no-explicit-any -- ignore */
import * as eslintUtils from "eslint-utils"
import type { Variable } from "eslint-scope"
import type { Rule } from "eslint"
import type * as ES from "estree"

/**
 * Find the variable of a given name.
 */
export function findVariable(
    context: Rule.RuleContext,
    node: ES.Identifier,
): Variable | null {
    return eslintUtils.findVariable(getScope(context, node), node)
}
/**
 * Get the property name from a MemberExpression node or a Property node.
 */
export function getPropertyName(
    context: Rule.RuleContext,
    node: ES.Property | ES.MemberExpression | ES.MethodDefinition,
): string | null {
    return eslintUtils.getPropertyName(node, getScope(context, node))
}
/**
 *  Check whether a given node is parenthesized or not.
 */
export function isParenthesized(
    context: Rule.RuleContext,
    node: ES.Node,
): boolean {
    return eslintUtils.isParenthesized(node, context.getSourceCode())
}

/**
 * Gets the scope for the current node
 */
function getScope(
    context: Rule.RuleContext,
    currentNode:
        | ES.Identifier
        | ES.Property
        | ES.MemberExpression
        | ES.MethodDefinition,
) {
    const scopeManager = (context.getSourceCode() as any).scopeManager

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

/** Get parent node */
export function getParent<E extends ES.Node>(node: ES.Node | null): E | null {
    if (!node) {
        return null
    }
    return (node as any).parent
}
