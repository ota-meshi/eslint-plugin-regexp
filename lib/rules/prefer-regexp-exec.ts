import type { CallExpression } from "estree"
import { createRule } from "../utils"
import { isKnownMethodCall, getStaticValue } from "../utils/ast-utils"
import { createTypeTracker } from "../utils/type-tracker"

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
                const evaluated = getStaticValue(context, arg)
                if (
                    evaluated &&
                    evaluated.value instanceof RegExp &&
                    evaluated.value.flags.includes("g")
                ) {
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
