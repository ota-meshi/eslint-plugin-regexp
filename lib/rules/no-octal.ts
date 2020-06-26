import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"

export default createRule("no-octal", {
    meta: {
        docs: {
            description: "disallow octal escape sequence",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: 'Unexpected octal escape sequence "{{expr}}".',
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
                    if (cNode.raw.startsWith("\\0") && cNode.raw !== "\\0") {
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, cNode),
                            messageId: "unexpected",
                            data: {
                                expr: cNode.raw,
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
