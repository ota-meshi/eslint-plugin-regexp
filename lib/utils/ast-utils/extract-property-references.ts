import type { Rule } from "eslint"
import type {
    ArrayExpression,
    ArrayPattern,
    Expression,
    ForOfStatement,
    MemberExpression,
    ObjectExpression,
    ObjectPattern,
    Pattern,
    Property,
    SpreadElement,
} from "estree"
import { getParent, getStringIfConstant } from "./utils"
import {
    extractExpressionReferences,
    extractExpressionReferencesForVariable,
} from "./extract-expression-references"

export type PropertyReference =
    | {
          // Property name is unknown.
          type: "unknown"
          extractPropertyReferences?: () => Iterable<PropertyReference>
      }
    | {
          type: "member"
          name: string
          extractPropertyReferences: () => Iterable<PropertyReference>
      }
    | {
          type: "destructuring"
          name: string
          extractPropertyReferences: () => Iterable<PropertyReference>
      }
    | {
          type: "iteration"
          extractPropertyReferences: () => Iterable<PropertyReference>
      }
/** Extract property references from the given expression */
export function* extractPropertyReferences(
    node: Expression,
    context: Rule.RuleContext,
): Iterable<PropertyReference> {
    if (isShallowCopy(node)) {
        yield* iteratePropertyReferencesForShallowCopy(node, context)
        return
    }

    for (const ref of extractExpressionReferences(node, context)) {
        if (ref.type === "member") {
            yield* iteratePropertyReferencesForMemberExpression(
                ref.memberExpression,
                context,
            )
        } else if (ref.type === "destructuring") {
            yield* iteratePropertyReferencesForPattern(ref.pattern, context)
        } else if (ref.type === "iteration") {
            yield* iteratePropertyReferencesForForOf(ref.for, context)
        } else {
            if (ref.node !== node && isShallowCopy(ref.node)) {
                yield* iteratePropertyReferencesForShallowCopy(
                    ref.node,
                    context,
                )
                return
            }
            yield { type: "unknown" }
        }
    }
}

/** Checks whether the given expression is shallow copied. */
function isShallowCopy(
    node: Expression,
): node is Expression & {
    parent: SpreadElement & { parent: ObjectExpression | ArrayExpression }
} {
    const parent = getParent(node)
    if (parent?.type === "SpreadElement") {
        const spreadParent = getParent(parent)
        if (
            spreadParent?.type === "ObjectExpression" ||
            spreadParent?.type === "ArrayExpression"
        ) {
            return true
        }
    }
    return false
}

/** Iterate property references from the given member expression */
function* iteratePropertyReferencesForMemberExpression(
    node: MemberExpression,
    context: Rule.RuleContext,
): Iterable<PropertyReference> {
    const property = getProperty(node, context)
    if (property == null) {
        yield {
            type: "unknown",
            *extractPropertyReferences() {
                yield* extractPropertyReferences(node, context)
            },
        }
        return
    }
    yield {
        type: "member",
        name: property,
        *extractPropertyReferences() {
            yield* extractPropertyReferences(node, context)
        },
    }
}

/** Iterate property references from the given object pattern */
function* iteratePropertyReferencesForObjectPattern(
    node: ObjectPattern,
    context: Rule.RuleContext,
): Iterable<PropertyReference> {
    for (const prop of node.properties) {
        if (prop.type === "RestElement") {
            yield* iteratePropertyReferencesForPattern(prop.argument, context)
            continue
        }
        const property = getProperty(prop, context)
        if (property == null) {
            yield {
                type: "unknown",
                *extractPropertyReferences() {
                    yield* iteratePropertyReferencesForPattern(
                        prop.value,
                        context,
                    )
                },
            }
            continue
        }
        yield {
            type: "destructuring",
            name: property,
            *extractPropertyReferences() {
                yield* iteratePropertyReferencesForPattern(prop.value, context)
            },
        }
    }
}

/** Iterate property references from the given array pattern */
function* iteratePropertyReferencesForArrayPattern(
    node: ArrayPattern,
    context: Rule.RuleContext,
): Iterable<PropertyReference> {
    let index = 0
    for (; index < node.elements.length; index++) {
        const element = node.elements[index]
        if (!element) {
            continue
        }
        if (element.type === "RestElement") {
            for (const ref of iteratePropertyReferencesForPattern(
                element.argument,
                context,
            )) {
                yield offsetRef(ref, index)
            }
            index++
            break
        }
        yield {
            type: "destructuring",
            name: String(index),
            *extractPropertyReferences() {
                yield* iteratePropertyReferencesForPattern(element, context)
            },
        }
    }
    for (; index < node.elements.length; index++) {
        const element = node.elements[index]
        if (!element) {
            continue
        }
        yield {
            type: "unknown",
            *extractPropertyReferences() {
                yield* iteratePropertyReferencesForPattern(element, context)
            },
        }
    }
}

/** Iterate property references from the given for of statement */
function* iteratePropertyReferencesForForOf(
    node: ForOfStatement,
    context: Rule.RuleContext,
): Iterable<PropertyReference> {
    yield {
        type: "iteration",
        *extractPropertyReferences() {
            let left = node.left
            if (left.type === "VariableDeclaration") {
                left = left.declarations[0].id
            }
            yield* iteratePropertyReferencesForPattern(left, context)
        },
    }
}

/** Iterate property references from the given pattern */
function* iteratePropertyReferencesForPattern(
    node: Pattern,
    context: Rule.RuleContext,
): Iterable<PropertyReference> {
    let target = node
    while (target.type === "AssignmentPattern") {
        target = target.left
    }
    if (target.type === "Identifier") {
        for (const exprRef of extractExpressionReferencesForVariable(
            target,
            context,
        )) {
            yield* extractPropertyReferences(exprRef.node, context)
        }
    } else if (target.type === "ObjectPattern") {
        yield* iteratePropertyReferencesForObjectPattern(target, context)
    } else if (target.type === "ArrayPattern") {
        yield* iteratePropertyReferencesForArrayPattern(target, context)
    } else {
        yield { type: "unknown" }
    }
}

/** Iterate property references from the given shallow copy expression */
function* iteratePropertyReferencesForShallowCopy(
    node: Expression & {
        parent: SpreadElement & { parent: ObjectExpression | ArrayExpression }
    },
    context: Rule.RuleContext,
): Iterable<PropertyReference> {
    const spread = node.parent
    const spreadParent = spread.parent
    if (spreadParent.type === "ObjectExpression") {
        yield* extractPropertyReferences(spreadParent, context)
    } else if (spreadParent.type === "ArrayExpression") {
        const index = spreadParent.elements.indexOf(spread)
        if (index === 0) {
            // e.g. [...expr] or [...expr, after]
            yield* extractPropertyReferences(spreadParent, context)
            return
        }
        const hasSpread = spreadParent.elements
            .slice(0, index)
            .some((e) => e?.type === "SpreadElement")
        if (hasSpread) {
            for (const ref of extractPropertyReferences(
                spreadParent,
                context,
            )) {
                yield {
                    type: "unknown",
                    extractPropertyReferences: ref.extractPropertyReferences,
                }
            }
        } else {
            for (const ref of extractPropertyReferences(
                spreadParent,
                context,
            )) {
                yield offsetRef(ref, -index)
            }
        }
    }
}

/**
 * Get property from given node
 */
function getProperty(
    node: MemberExpression | Property,
    context: Rule.RuleContext,
): null | string {
    if (node.type === "MemberExpression") {
        if (node.computed) {
            if (node.property.type === "Literal") {
                if (
                    typeof node.property.value === "string" ||
                    typeof node.property.value === "number"
                )
                    return String(node.property.value)
            }
            return getStringIfConstant(context, node.property)
        } else if (node.property.type === "Identifier") {
            return node.property.name
        }
    }
    if (node.type === "Property") {
        if (node.key.type === "Literal") {
            if (
                typeof node.key.value === "string" ||
                typeof node.key.value === "number"
            )
                return String(node.key.value)
        }
        if (node.computed) {
            return getStringIfConstant(context, node.key)
        } else if (node.key.type === "Identifier") {
            return node.key.name
        }
    }
    return null
}

/** Moves the reference position of the index reference. */
function offsetRef(ref: PropertyReference, offset: number): PropertyReference {
    if (ref.type === "member" || ref.type === "destructuring") {
        const num = Number(ref.name) + offset
        if (!Number.isNaN(num)) {
            return { ...ref, name: String(num) }
        }
    }
    return ref
}
