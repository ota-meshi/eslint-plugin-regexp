import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    fixReplaceNode,
    getRegexpLocation,
} from "../utils"

export default createRule("no-useless-range", {
    meta: {
        docs: {
            description:
                "disallow unnecessary range of characters by using a hyphen",
            // TODO In the major version, it will be changed to "recommended".
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                "Unexpected unnecessary range of characters by using a hyphen.",
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
                onCharacterClassRangeEnter(ccrNode) {
                    if (
                        ccrNode.min.value !== ccrNode.max.value &&
                        ccrNode.min.value + 1 !== ccrNode.max.value
                    ) {
                        return
                    }
                    context.report({
                        node,
                        loc: getRegexpLocation(sourceCode, node, ccrNode),
                        messageId: "unexpected",
                        fix: fixReplaceNode(sourceCode, node, ccrNode, () => {
                            const parent = ccrNode.parent
                            const rawBefore = parent.raw.slice(
                                0,
                                ccrNode.start - parent.start,
                            )
                            const rawAfter = parent.raw.slice(
                                ccrNode.end - parent.start,
                            )

                            if (
                                /\\(?:x[\dA-Fa-f]?|u[\dA-Fa-f]{0,3})?$/.test(
                                    rawBefore,
                                )
                            ) {
                                // It will not autofix because it is preceded
                                // by an incomplete escape sequence
                                return null
                            }

                            let text = ccrNode.min.raw
                            if (ccrNode.min.value < ccrNode.max.value) {
                                if (ccrNode.max.raw === "-") {
                                    // This "-" might be interpreted as a range
                                    // operator now, so we have to escape it
                                    // e.g. /[,--b]/ -> /[,\-b]/
                                    text += `\\-`
                                } else {
                                    text += `${ccrNode.max.raw}`
                                }
                            }

                            if (rawAfter.startsWith("-")) {
                                // the next "-" might be interpreted as a range
                                // operator now, so we have to escape it
                                // e.g. /[a-a-z]/ -> /[a\-z]/
                                text += "\\"
                            }
                            return text
                        }),
                    })
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
