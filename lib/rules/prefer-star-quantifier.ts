import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor, getQuantifierOffsets } from "../utils"

export default createRule("prefer-star-quantifier", {
    meta: {
        docs: {
            description: "enforce using `*` quantifier",
            category: "Stylistic Issues",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: "Unexpected quantifier '{{expr}}'. Use '*' instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor({
            node,
            getRegexpLocation,
            fixReplaceQuant,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onQuantifierEnter(qNode) {
                    if (qNode.min === 0 && qNode.max === Infinity) {
                        const [startOffset, endOffset] =
                            getQuantifierOffsets(qNode)
                        const text = qNode.raw.slice(startOffset, endOffset)
                        if (text !== "*") {
                            context.report({
                                node,
                                loc: getRegexpLocation(qNode, [
                                    startOffset,
                                    endOffset,
                                ]),
                                messageId: "unexpected",
                                data: {
                                    expr: text,
                                },
                                fix: fixReplaceQuant(qNode, "*"),
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
