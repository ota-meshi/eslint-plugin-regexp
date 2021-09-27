import { mention } from "../utils/mention"
import type { Group, Quantifier } from "regexpp/ast"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor, getQuantifierOffsets } from "../utils"

export default createRule("prefer-question-quantifier", {
    meta: {
        docs: {
            description: "enforce using `?` quantifier",
            category: "Stylistic Issues",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: "Unexpected quantifier '{{expr}}'. Use '?' instead.",
            unexpectedGroup:
                "Unexpected group {{expr}}. Use '{{instead}}' instead.",
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
            fixReplaceNode,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onQuantifierEnter(qNode) {
                    if (qNode.min === 0 && qNode.max === 1) {
                        const [startOffset, endOffset] =
                            getQuantifierOffsets(qNode)
                        const text = qNode.raw.slice(startOffset, endOffset)
                        if (text !== "?") {
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
                                fix: fixReplaceQuant(qNode, "?"),
                            })
                        }
                    }
                },
                onGroupEnter(gNode) {
                    const lastAlt =
                        gNode.alternatives[gNode.alternatives.length - 1]
                    if (!lastAlt.elements.length) {
                        // last alternative is empty. e.g /(?:a|)/, /(?:a|b|)/
                        const alternatives = gNode.alternatives.slice(0, -1)
                        while (alternatives.length > 0) {
                            if (
                                !alternatives[alternatives.length - 1].elements
                                    .length
                            ) {
                                // last alternative is empty.
                                alternatives.pop()
                                continue
                            }
                            break
                        }
                        if (!alternatives.length) {
                            // all empty
                            return
                        }

                        let reportNode: Group | Quantifier = gNode
                        const instead = `(?:${alternatives
                            .map((ne) => ne.raw)
                            .join("|")})?`
                        if (gNode.parent.type === "Quantifier") {
                            if (
                                gNode.parent.greedy &&
                                gNode.parent.min === 0 &&
                                gNode.parent.max === 1
                            ) {
                                reportNode = gNode.parent
                            } else {
                                // It is possible to use group `(?:)` and `?`,
                                // but we will not report this as it makes the regex more complicated.
                                return
                            }
                        }
                        context.report({
                            node,
                            loc: getRegexpLocation(reportNode),
                            messageId: "unexpectedGroup",
                            data: {
                                expr: mention(reportNode),
                                instead,
                            },
                            fix: fixReplaceNode(reportNode, instead),
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
