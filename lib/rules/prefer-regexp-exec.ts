import type { CallExpression } from "estree"
import { createRule } from "../utils"
import { createTypeTracker } from "../utils/type-tracker"
import { getStaticValue } from "eslint-utils"

// Inspired by https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/src/rules/prefer-regexp-exec.ts
export default createRule("prefer-regexp-exec", {
    meta: {
        docs: {
            description:
                "enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided",
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
                if (node.arguments.length !== 1) {
                    return
                }
                if (
                    node.callee.type !== "MemberExpression" ||
                    node.callee.computed ||
                    node.callee.property.type !== "Identifier" ||
                    node.callee.property.name !== "match" ||
                    node.callee.object.type === "Super"
                ) {
                    return
                }
                const arg = node.arguments[0]
                const evaluated = getStaticValue(arg, context.getScope())
                if (
                    evaluated?.value instanceof RegExp &&
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
