import type { RegExpVisitor } from "regexpp/visitor"
import type { CharacterClass, CharacterClassRange } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import {
    createRule,
    defineRegexpVisitor,
    CP_DIGIT_ZERO,
    CP_DIGIT_NINE,
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
                "Unexpected {{type}} '{{expr}}'. Use '{{instead}}' instead.",
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
            fixReplaceNode,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onCharacterClassRangeEnter(ccrNode: CharacterClassRange) {
                    if (
                        ccrNode.min.value === CP_DIGIT_ZERO &&
                        ccrNode.max.value === CP_DIGIT_NINE
                    ) {
                        let reportNode: CharacterClass | CharacterClassRange,
                            instead: string
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
                            loc: getRegexpLocation(reportNode),
                            messageId: "unexpected",
                            data: {
                                type:
                                    reportNode.type === "CharacterClass"
                                        ? "character class"
                                        : "character class range",
                                expr: reportNode.raw,
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
