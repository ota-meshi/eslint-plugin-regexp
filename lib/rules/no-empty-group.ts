import type { RegExpVisitor } from "regexpp/visitor"
import type { Group, CapturingGroup } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("no-empty-group", {
    meta: {
        docs: {
            description: "disallow empty group",
            category: "Possible Errors",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected empty group.",
        },
        type: "suggestion",
    },
    create(context) {
        /**
         * verify group node
         */
        function verifyGroup(
            { node, getRegexpLocation }: RegExpContext,
            gNode: Group | CapturingGroup,
        ) {
            if (gNode.alternatives.every((alt) => alt.elements.length === 0)) {
                context.report({
                    node,
                    loc: getRegexpLocation(gNode),
                    messageId: "unexpected",
                })
            }
        }

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            return {
                onGroupEnter(gNode) {
                    verifyGroup(regexpContext, gNode)
                },
                onCapturingGroupEnter(cgNode) {
                    verifyGroup(regexpContext, cgNode)
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
