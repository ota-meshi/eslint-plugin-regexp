import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    fixerApplyEscape,
    getRegexpLocation,
    getRegexpRange,
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
                        fix(fixer) {
                            const range = getRegexpRange(
                                sourceCode,
                                node,
                                ccrNode,
                            )
                            if (range == null) {
                                return null
                            }
                            let text =
                                ccrNode.min.value < ccrNode.max.value
                                    ? ccrNode.min.raw + ccrNode.max.raw
                                    : ccrNode.min.raw

                            const parent = ccrNode.parent
                            const next =
                                parent.elements[
                                    parent.elements.indexOf(ccrNode) + 1
                                ]
                            if (
                                next &&
                                next.type === "Character" &&
                                next.raw === "-"
                            ) {
                                text += fixerApplyEscape("\\", node)
                            }
                            return fixer.replaceTextRange(range, text)
                        },
                    })
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
