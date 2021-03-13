import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    getRegexpRange,
} from "../utils"

export default createRule("prefer-unicode-codepoint-escapes", {
    meta: {
        docs: {
            description: "enforce use of unicode codepoint escapes",
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
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(
            node: Expression,
            _pattern: string,
            flags: string,
        ): RegExpVisitor.Handlers {
            if (!flags.includes("u")) {
                return {}
            }
            return {
                onCharacterEnter(cNode) {
                    if (cNode.value >= 0x10000) {
                        if (/^(?:\\u[\dA-Fa-f]{4}){2}$/.test(cNode.raw)) {
                            context.report({
                                node,
                                loc: getRegexpLocation(sourceCode, node, cNode),
                                messageId: "disallowSurrogatePair",
                                fix(fixer) {
                                    const range = getRegexpRange(
                                        sourceCode,
                                        node,
                                        cNode,
                                    )
                                    if (range == null) {
                                        return null
                                    }
                                    let text = String.fromCodePoint(cNode.value)
                                        .codePointAt(0)!
                                        .toString(16)
                                    if (/[A-F]/.test(cNode.raw)) {
                                        text = text.toUpperCase()
                                    }
                                    return fixer.replaceTextRange(
                                        range,
                                        `\\u{${text}}`,
                                    )
                                },
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
