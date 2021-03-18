import type { CallExpression, Literal } from "estree"
import { createRule } from "../utils"
import { isKnownMethodCall, parseReplacements } from "../utils/ast-utils"
import { createTypeTracker } from "../utils/type-tracker"
import { getStaticValue } from "eslint-utils"

export default createRule("prefer-escape-replacement-dollar-char", {
    meta: {
        docs: {
            description: "enforces escape of replacement `$` character (`$$`).",
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
        const sourceCode = context.getSourceCode()

        /** Verify */
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
                const evaluated = getStaticValue(
                    node.arguments[0],
                    context.getScope(),
                )
                if (!evaluated || !(evaluated.value instanceof RegExp)) {
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
