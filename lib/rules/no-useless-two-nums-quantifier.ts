import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    getQuantifierOffsets,
    fixReplaceQuant,
} from "../utils"

export default createRule("no-useless-two-nums-quantifier", {
    meta: {
        docs: {
            description: "disallow unnecessary `{n,m}` quantifier",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: 'Unexpected quantifier "{{expr}}".',
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
                    if (qNode.min === qNode.max) {
                        const [startOffset, endOffset] = getQuantifierOffsets(
                            qNode,
                        )
                        const text = qNode.raw.slice(startOffset, endOffset)
                        if (!/^\{\d+,\d+\}$/u.test(text)) {
                            return
                        }
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
                            fix: fixReplaceQuant(
                                sourceCode,
                                node,
                                qNode,
                                `{${qNode.min}}`,
                            ),
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
