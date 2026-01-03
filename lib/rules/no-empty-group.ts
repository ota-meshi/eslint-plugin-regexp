import type { Group, CapturingGroup } from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils/index.ts"
import { createRule, defineRegexpVisitor } from "../utils/index.ts"

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
