import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { CharacterClassRange, Node as RegExpNode } from "regexpp/ast"
import {
    createRule,
    defineRegexpVisitor,
    CP_DIGIT_ZERO,
    CP_DIGIT_NINE,
    getRegexpLocation,
    getRegexpRange,
    fixerApplyEscape,
} from "../utils"

export default createRule("prefer-d", {
    meta: {
        docs: {
            description: "enforce using `\\d`",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                'Unexpected character set "{{expr}}". Use "{{instead}}" instead.',
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
                onCharacterClassRangeEnter(ccrNode: CharacterClassRange) {
                    if (
                        ccrNode.min.value === CP_DIGIT_ZERO &&
                        ccrNode.max.value === CP_DIGIT_NINE
                    ) {
                        let reportNode: RegExpNode
                        let instead: string
                        const ccNode = ccrNode.parent
                        if (ccNode.elements.length === 1) {
                            reportNode = ccNode
                            instead = ccNode.negate ? "\\D" : "\\d"
                        } else {
                            reportNode = ccrNode
                            instead = "\\d"
                        }
                        context.report({
                            node,
                            loc: getRegexpLocation(
                                sourceCode,
                                node,
                                reportNode,
                            ),
                            messageId: "unexpected",
                            data: {
                                expr: reportNode.raw,
                                instead,
                            },
                            fix(fixer) {
                                const range = getRegexpRange(
                                    sourceCode,
                                    node,
                                    reportNode,
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
