import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    getRegexpRange,
} from "../utils"

export default createRule("no-useless-non-greedy", {
    meta: {
        docs: {
            description: "disallow unnecessary quantifier non-greedy (`?`)",
            // TODO In the major version
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: "Unexpected quantifier non-greedy.",
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
                onQuantifierEnter(qNode) {
                    if (qNode.greedy === false && qNode.min === qNode.max) {
                        const offset = qNode.raw.length - 1
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, qNode, [
                                offset,
                                offset + 1,
                            ]),
                            messageId: "unexpected",
                            fix(fixer) {
                                const range = getRegexpRange(
                                    sourceCode,
                                    node,
                                    qNode,
                                )
                                if (range == null) {
                                    return null
                                }
                                return fixer.removeRange([
                                    range[1] - 1,
                                    range[1],
                                ])
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
