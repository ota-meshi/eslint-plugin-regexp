import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    getRegexpRange,
} from "../utils"

export default createRule("prefer-t", {
    meta: {
        docs: {
            description: "enforce using `\\t`",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: 'Unexpected character "{{expr}}". Use "\\t" instead.',
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
                onCharacterEnter(cNode) {
                    if (cNode.value === 9 && cNode.raw !== "\\t") {
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, cNode),
                            messageId: "unexpected",
                            data: {
                                expr: cNode.raw,
                            },
                            fix(fixer) {
                                const range = getRegexpRange(
                                    sourceCode,
                                    node,
                                    cNode,
                                )
                                if (range == null) {
                                    return null
                                }
                                return fixer.replaceTextRange(range, "\\t")
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
