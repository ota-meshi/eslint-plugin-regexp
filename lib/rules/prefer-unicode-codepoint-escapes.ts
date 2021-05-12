import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("prefer-unicode-codepoint-escapes", {
    meta: {
        docs: {
            description: "enforce use of unicode codepoint escapes",
            category: "Stylistic Issues",
            // TODO In the major version, it will be changed to "recommended".
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            disallowSurrogatePair:
                "Use Unicode codepoint escapes instead of Unicode escapes using surrogate pairs.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const {
                node,
                flags,
                getRegexpLocation,
                fixReplaceNode,
            } = regexpContext
            if (!flags.unicode) {
                return {}
            }
            return {
                onCharacterEnter(cNode) {
                    if (cNode.value >= 0x10000) {
                        if (/^(?:\\u[\dA-Fa-f]{4}){2}$/.test(cNode.raw)) {
                            context.report({
                                node,
                                loc: getRegexpLocation(cNode),
                                messageId: "disallowSurrogatePair",
                                fix: fixReplaceNode(cNode, () => {
                                    let text = String.fromCodePoint(cNode.value)
                                        .codePointAt(0)!
                                        .toString(16)
                                    if (/[A-F]/.test(cNode.raw)) {
                                        text = text.toUpperCase()
                                    }
                                    return `\\u{${text}}`
                                }),
                            })
                        }
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
