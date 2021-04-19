import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import {
    createRule,
    defineRegexpVisitor,
    CP_DIGIT_ZERO,
    CP_DIGIT_NINE,
} from "../utils"
import { Chars } from "regexp-ast-analysis"

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
            flags,
            getRegexpLocation,
            fixReplaceNode,
            toCharSet,
        }: RegExpContext): RegExpVisitor.Handlers {
            let reportedCharacterClass = false

            return {
                onCharacterClassEnter(ccNode) {
                    const charSet = toCharSet(ccNode)

                    let predefined: string | undefined = undefined
                    if (charSet.equals(Chars.digit(flags))) {
                        predefined = "\\d"
                    } else if (charSet.equals(Chars.digit(flags).negate())) {
                        predefined = "\\D"
                    }

                    if (predefined) {
                        reportedCharacterClass = true

                        context.report({
                            node,
                            loc: getRegexpLocation(ccNode),
                            messageId: "unexpected",
                            data: {
                                type: "character class",
                                expr: ccNode.raw,
                                instead: predefined,
                            },
                            fix: fixReplaceNode(ccNode, predefined),
                        })
                    }
                },
                onCharacterClassLeave() {
                    reportedCharacterClass = false
                },
                onCharacterClassRangeEnter(ccrNode) {
                    if (reportedCharacterClass) {
                        return
                    }

                    if (
                        ccrNode.min.value === CP_DIGIT_ZERO &&
                        ccrNode.max.value === CP_DIGIT_NINE
                    ) {
                        const instead = "\\d"

                        context.report({
                            node,
                            loc: getRegexpLocation(ccrNode),
                            messageId: "unexpected",
                            data: {
                                type: "character class range",
                                expr: ccrNode.raw,
                                instead,
                            },
                            fix: fixReplaceNode(ccrNode, instead),
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
