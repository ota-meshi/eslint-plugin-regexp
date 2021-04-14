import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    getQuantifierOffsets,
} from "../utils"

export default createRule("no-useless-exactly-quantifier", {
    meta: {
        docs: {
            description: "disallow unnecessary exactly quantifier",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected quantifier '{{expr}}'.",
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
                onQuantifierEnter(qNode) {
                    if (
                        qNode.min === qNode.max &&
                        (qNode.min === 0 || qNode.min === 1)
                    ) {
                        const [startOffset, endOffset] = getQuantifierOffsets(
                            qNode,
                        )
                        const text = qNode.raw.slice(startOffset, endOffset)
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, qNode, [
                                startOffset,
                                endOffset,
                            ]),
                            messageId: "unexpected",
                            data: {
                                expr: text,
                            },
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
