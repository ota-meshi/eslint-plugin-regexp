import type { CallExpression, Literal } from "estree"
import {
    isKnownMethodCall,
    parseReplacements,
} from "../utils/ast-utils/index.ts"
import { createRule } from "../utils/index.ts"
import { createTypeTracker } from "../utils/type-tracker/index.ts"

export default createRule("prefer-escape-replacement-dollar-char", {
    meta: {
        docs: {
            description: "enforces escape of replacement `$` character (`$$`).",
            category: "Best Practices",
            recommended: false,
        },
        schema: [],
        messages: {
            unexpected:
                "Unexpected replacement `$` character without escaping. Use `$$` instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const typeTracer = createTypeTracker(context)
        const sourceCode = context.sourceCode

        function verify(replacement: Literal) {
            for (const element of parseReplacements(context, replacement)) {
                if (
                    element.type === "CharacterElement" &&
                    element.value === "$"
                ) {
                    context.report({
                        node: replacement,
                        loc: {
                            start: sourceCode.getLocFromIndex(element.range[0]),
                            end: sourceCode.getLocFromIndex(element.range[1]),
                        },
                        messageId: "unexpected",
                    })
                }
            }
        }

        return {
            CallExpression(node: CallExpression) {
                if (!isKnownMethodCall(node, { replace: 2, replaceAll: 2 })) {
                    return
                }
                const mem = node.callee
                const replacementTextNode = node.arguments[1]
                if (
                    replacementTextNode.type !== "Literal" ||
                    typeof replacementTextNode.value !== "string"
                ) {
                    return
                }
                if (!typeTracer.isRegExp(node.arguments[0])) {
                    return
                }
                if (!typeTracer.isString(mem.object)) {
                    return
                }
                verify(replacementTextNode)
            },
        }
    },
})
