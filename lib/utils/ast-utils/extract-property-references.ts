import type { Rule } from "eslint"
import type {
    ArrayPattern,
    Expression,
    ForOfStatement,
    MemberExpression,
    ObjectPattern,
    Pattern,
    Property,
} from "estree"
import { getStringIfConstant } from "."
import {
    extractExpressionReferences,
    extractExpressionReferencesForVariable,
} from "./extract-expression-references"

export type PropertyReference =
    | {
          // Property name is unknown.
          type: "unknown"
      }
    | {
          type: "member"
          ref: string
          references: () => IterableIterator<PropertyReference>
      }
    | {
          type: "destructuring"
          ref: string
          references: () => IterableIterator<PropertyReference>
      }
    | {
          type: "iteration"
          references: () => IterableIterator<PropertyReference>
      }
/** Extract property references from the given expression */
export function* extractPropertyReferences(
    node: Expression,
    context: Rule.RuleContext,
): IterableIterator<PropertyReference> {
    for (const ref of node.type === "Identifier"
        ? extractExpressionReferencesForVariable(node, context)
        : extractExpressionReferences(node, context)) {
        if (ref.type === "member") {
            yield* iteratePropertyReferencesForMemberExpression(
                ref.memberExpression,
                context,
            )
        } else if (ref.type === "destructuring") {
            if (ref.pattern.type === "ObjectPattern") {
                yield* iteratePropertyReferencesForObjectPattern(
                    ref.pattern,
                    context,
                )
            } else if (ref.pattern.type === "ArrayPattern") {
                yield* iteratePropertyReferencesForArrayPattern(
                    ref.pattern,
                    context,
                )
            }
        } else if (ref.type === "iteration") {
            yield* iteratePropertyReferencesForForOf(ref.for, context)
        } else {
            yield { type: "unknown" }
        }
    }
}

/** Iterate property references from the given member expression */
function* iteratePropertyReferencesForMemberExpression(
    node: MemberExpression,
    context: Rule.RuleContext,
): IterableIterator<PropertyReference> {
    const property = getProperty(node, context)
    if (property == null) {
        yield { type: "unknown" }
        return
    }
    yield {
        type: "member",
        ref: property,
        *references() {
            yield* extractPropertyReferences(node, context)
        },
    }
}

/** Iterate property references from the given object pattern */
function* iteratePropertyReferencesForObjectPattern(
    node: ObjectPattern,
    context: Rule.RuleContext,
): IterableIterator<PropertyReference> {
    for (const prop of node.properties) {
        if (prop.type === "RestElement") {
            yield* iteratePropertyReferencesForPattern(prop.argument, context)
            continue
        }
        const property = getProperty(prop, context)
        if (property == null) {
            yield { type: "unknown" }
            continue
        }
        yield {
            type: "destructuring",
            ref: property,
            *references() {
                yield* iteratePropertyReferencesForPattern(prop.value, context)
            },
        }
    }
}

/** Iterate property references from the given array pattern */
function* iteratePropertyReferencesForArrayPattern(
    node: ArrayPattern,
    context: Rule.RuleContext,
): IterableIterator<PropertyReference> {
    for (let index = 0; index < node.elements.length; index++) {
        const element = node.elements[index]
        if (!element) {
            continue
        }
        if (element.type === "RestElement") {
            for (const ref of iteratePropertyReferencesForPattern(
                element.argument,
                context,
            )) {
                if (ref.type === "member" || ref.type === "destructuring") {
                    const num = Number(ref.ref) + index
                    if (Number.isFinite(num)) {
                        yield { ...ref, ref: String(num) }
                    } else {
                        yield ref
                    }
                } else {
                    yield ref
                }
            }
            continue
        }
        yield {
            type: "destructuring",
            ref: String(index),
            *references() {
                yield* iteratePropertyReferencesForPattern(element, context)
            },
        }
    }
}

/** Iterate property references from the given for of statement */
function* iteratePropertyReferencesForForOf(
    node: ForOfStatement,
    context: Rule.RuleContext,
): IterableIterator<PropertyReference> {
    yield {
        type: "iteration",
        *references() {
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
): IterableIterator<PropertyReference> {
    let target = node
    while (target.type === "AssignmentPattern") {
        target = target.left
    }
    if (target.type === "Identifier") {
        yield* extractPropertyReferences(target, context)
    } else if (target.type === "ObjectPattern") {
        yield* iteratePropertyReferencesForObjectPattern(target, context)
    } else if (target.type === "ArrayPattern") {
        yield* iteratePropertyReferencesForArrayPattern(target, context)
    } else {
        yield { type: "unknown" }
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
