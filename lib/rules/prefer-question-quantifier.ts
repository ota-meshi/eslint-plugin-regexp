import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    getQuantifierOffsets,
    getRegexpRange,
    fixerApplyEscape,
} from "../utils"

export default createRule("prefer-question-quantifier", {
    meta: {
        docs: {
            description: "enforce using `?` quantifier",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: 'Unexpected quantifier "{{expr}}". Use "?" instead.',
            unexpectedGroup:
                'Unexpected group "{{expr}}". Use "{{instead}}" instead.',
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
                    if (qNode.min === 0 && qNode.max === 1) {
                        const [startOffset, endOffset] = getQuantifierOffsets(
                            qNode,
                        )
                        const text = qNode.raw.slice(startOffset, endOffset)
                        if (text !== "?") {
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
                                fix(fixer) {
                                    const range = getRegexpRange(
                                        sourceCode,
                                        node,
                                        qNode,
                                    )
                                    if (range == null) {
                                        return null
                                    }
                                    return fixer.replaceTextRange(
                                        [
                                            range[0] + startOffset,
                                            range[0] + endOffset,
                                        ],
                                        "?",
                                    )
                                },
                            })
                        }
                    }
                },
                onGroupEnter(gNode) {
                    const nonEmpties = []
                    const empties = []
                    for (const alt of gNode.alternatives) {
                        if (alt.elements.length === 0) {
                            empties.push(alt)
                        } else {
                            nonEmpties.push(alt)
                        }
                    }
                    if (empties.length && nonEmpties.length) {
                        const instead = `(?:${nonEmpties
                            .map((ne) => ne.raw)
                            .join("|")})?`
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, gNode),
                            messageId: "unexpectedGroup",
                            data: {
                                expr: gNode.raw,
                                instead,
                            },
                            fix(fixer) {
                                const range = getRegexpRange(
                                    sourceCode,
                                    node,
                                    gNode,
                                )
                                if (range == null) {
                                    return null
                                }
                                return fixer.replaceTextRange(
                                    range,
                                    fixerApplyEscape(instead, node),
                                )
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
