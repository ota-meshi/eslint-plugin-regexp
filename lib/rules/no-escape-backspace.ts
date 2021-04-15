import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    CP_BACKSPACE,
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
} from "../utils"

export default createRule("no-escape-backspace", {
    meta: {
        docs: {
            description: "disallow escape backspace (`[\\b]`)",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected '[\\b]'. Use '\\u0008' instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            return {
                onCharacterEnter(cNode) {
                    if (cNode.value === CP_BACKSPACE && cNode.raw === "\\b") {
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, cNode),
                            messageId: "unexpected",
                        })
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
