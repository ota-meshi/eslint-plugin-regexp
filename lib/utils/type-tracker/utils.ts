import * as eslintUtils from "@eslint-community/eslint-utils"
import type { Variable } from "eslint-scope"
import type { Rule } from "eslint"
import type * as ES from "estree"
import * as astUtils from "../ast-utils"

/**
 * Find the variable of a given name.
 */
export function findVariable(
    context: Rule.RuleContext,
    node: ES.Identifier,
): Variable | null {
    return astUtils.findVariable(context, node)
}
/**
 * Get the property name from a MemberExpression node or a Property node.
 */
export function getPropertyName(
    context: Rule.RuleContext,
    node: ES.Property | ES.MemberExpression | ES.MethodDefinition,
): string | null {
    return eslintUtils.getPropertyName(node, astUtils.getScope(context, node))
}
/**
 *  Check whether a given node is parenthesized or not.
 */
export function isParenthesized(
    context: Rule.RuleContext,
    node: ES.Node,
): boolean {
    return eslintUtils.isParenthesized(node, context.sourceCode)
}
