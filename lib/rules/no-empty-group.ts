import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { Group, CapturingGroup } from "regexpp/ast"
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"

export default createRule("no-empty-group", {
    meta: {
        docs: {
            description: "disallow empty group",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected empty group.",
        },
        type: "suggestion",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * verify group node
         */
        function verifyGroup(node: Expression, gNode: Group | CapturingGroup) {
            if (gNode.alternatives.every((alt) => alt.elements.length === 0)) {
                context.report({
                    node,
                    loc: getRegexpLocation(sourceCode, node, gNode),
                    messageId: "unexpected",
                })
            }
        }

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            return {
                onGroupEnter(gNode) {
                    verifyGroup(node, gNode)
                },
                onCapturingGroupEnter(cgNode) {
                    verifyGroup(node, cgNode)
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
