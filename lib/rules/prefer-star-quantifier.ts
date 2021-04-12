import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    getQuantifierOffsets,
    fixReplaceQuant,
} from "../utils"

export default createRule("prefer-star-quantifier", {
    meta: {
        docs: {
            description: "enforce using `*` quantifier",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: 'Unexpected quantifier "{{expr}}". Use "*" instead.',
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
                    if (qNode.min === 0 && qNode.max === Infinity) {
                        const [startOffset, endOffset] = getQuantifierOffsets(
                            qNode,
                        )
                        const text = qNode.raw.slice(startOffset, endOffset)
                        if (text !== "*") {
                            context.report({
                                node,
                                loc: getRegexpLocation(
                                    sourceCode,
                                    node,
                                    qNode,
                                    [startOffset, endOffset],
                                ),
                                messageId: "unexpected",
                                data: {
                                    expr: text,
                                },
                                fix: fixReplaceQuant(
                                    sourceCode,
                                    node,
                                    qNode,
                                    "*",
                                ),
                            })
                        }
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
