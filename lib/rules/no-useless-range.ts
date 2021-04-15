import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    CP_BACK_SLASH,
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
                            const index = parent.elements.indexOf(ccrNode)

                            if (
                                [
                                    ...parent.elements.slice(0, index),
                                    ccrNode.min,
                                ].some((e) => {
                                    if (e.type !== "Character") {
                                        return false
                                    }
                                    if (
                                        e.value === CP_BACK_SLASH &&
                                        e.raw === "\\"
                                    ) {
                                        // If there is a backslash without escaping,
                                        // it will not autofix as it can break regexp.
                                        return true
                                    }

                                    // If there are unnecessary escapes,
                                    // it will not autofix as it can break regexp.
                                    return (
                                        e.raw === "\\x" ||
                                        e.raw === "\\u" ||
                                        e.raw === "\\c"
                                    )
                                })
                            ) {
                                // It will not autofix
                                return null
                            }

                            let text: string
                            if (ccrNode.min.value < ccrNode.max.value) {
                                text = `${ccrNode.min.raw}${ccrNode.max.raw}`

                                if (ccrNode.max.raw === "-") {
                                    // /[,--b]/ -> /[,\-b]/
                                    text = `${ccrNode.min.raw}\\-`
                                }
                            } else {
                                text = ccrNode.min.raw
                            }

                            const next = parent.elements[index + 1]
                            if (
                                next &&
                                next.type === "Character" &&
                                next.raw === "-"
                            ) {
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
