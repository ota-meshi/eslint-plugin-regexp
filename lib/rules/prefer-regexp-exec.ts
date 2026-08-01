import type { CallExpression, Expression, Node } from "estree"
import {
    getParent,
    getStaticValue,
    isKnownMethodCall,
} from "../utils/ast-utils/index.ts"
import { createRule } from "../utils/index.ts"
import { createTypeTracker } from "../utils/type-tracker/index.ts"

// Inspired by https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-regexp-exec.md
export default createRule("prefer-regexp-exec", {
    meta: {
        docs: {
            description:
                "enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided",
            category: "Best Practices",
            recommended: false,
        },
        schema: [],
        messages: {
            disallow: "Use the `RegExp#exec()` method instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const typeTracer = createTypeTracker(context)

        return {
            CallExpression(node: CallExpression) {
                if (!isKnownMethodCall(node, { match: 1 })) {
                    return
                }
                const arg = node.arguments[0]
                const evaluated = getStaticRegExpValue(context, arg)
                if (
                    evaluated &&
                    evaluated.value instanceof RegExp &&
                    evaluated.value.flags.includes("g")
                ) {
                    return
                }
                if (!evaluated && typeTracer.isRegExp(arg)) {
                    // The global flag is unknown, so `String#match` may not
                    // be equivalent to `RegExp#exec`.
                    return
                }
                if (!typeTracer.isString(node.callee.object)) {
                    return
                }
                context.report({
                    node,
                    messageId: "disallow",
                })
            },
        }
    },
})

/**
 * Gets a RegExp value whose flags can be determined without executing code.
 *
 * In addition to regular static values, this supports direct reads of an
 * instance field initialized with a static RegExp. Type information can tell
 * us that a field is a RegExp, but not whether it has the global flag.
 */
function getStaticRegExpValue(
    context: Parameters<typeof getStaticValue>[0],
    node: Expression,
) {
    const evaluated = getStaticValue(context, node)
    if (evaluated || node.type !== "MemberExpression") {
        return evaluated
    }
    if (
        node.computed ||
        node.object.type !== "ThisExpression" ||
        node.property.type !== "Identifier"
    ) {
        return null
    }
    const propertyName = node.property.name

    const classBody = getEnclosingClassBody(node)
    if (!classBody) {
        return null
    }
    for (const element of classBody.body) {
        if (
            element.type === "PropertyDefinition" &&
            !element.static &&
            !element.computed &&
            element.key.type === "Identifier" &&
            element.key.name === propertyName
        ) {
            return element.value ? getStaticValue(context, element.value) : null
        }
    }
    return null
}

function getEnclosingClassBody(node: Node) {
    let current: Node | null = node
    while ((current = getParent(current))) {
        if (current.type === "ClassBody") {
            return current
        }
        if (
            (current.type === "FunctionExpression" ||
                current.type === "FunctionDeclaration") &&
            getParent(current)?.type !== "MethodDefinition"
        ) {
            return null
        }
    }
    return null
}
