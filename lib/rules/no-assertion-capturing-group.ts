import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"

export default createRule("no-assertion-capturing-group", {
    meta: {
        docs: {
            description: "disallow capturing group that captures assertions.",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected capture assertions.",
        },
        type: "suggestion",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            return {
                onCapturingGroupEnter(cgNode) {
                    if (
                        cgNode.alternatives.every((alt) =>
                            alt.elements.every((e) => e.type === "Assertion"),
                        )
                    ) {
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, cgNode),
                            messageId: "unexpected",
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
