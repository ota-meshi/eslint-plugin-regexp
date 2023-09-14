import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("no-useless-range", {
    meta: {
        docs: {
            description: "disallow unnecessary character ranges",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                "Unexpected unnecessary character ranges. The hyphen is unnecessary.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        function createVisitor({
            node,
            fixReplaceNode,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
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
                        loc: getRegexpLocation(ccrNode),
                        messageId: "unexpected",
                        fix: fixReplaceNode(ccrNode, () => {
                            const parent = ccrNode.parent
                            const rawBefore = parent.raw.slice(
                                0,
                                ccrNode.start - parent.start,
                            )
                            const rawAfter = parent.raw.slice(
                                ccrNode.end - parent.start,
                            )

                            if (
                                /\\(?:x[\dA-Fa-f]?|u[\dA-Fa-f]{0,3})?$/u.test(
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
