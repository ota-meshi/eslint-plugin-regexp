import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("prefer-named-backreference", {
    meta: {
        docs: {
            description: "enforce using named backreferences",
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: "Unexpected unnamed backreference.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor({
            node,
            fixReplaceNode,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onBackreferenceEnter(bNode) {
                    if (bNode.resolved.name && !bNode.raw.startsWith("\\k<")) {
                        context.report({
                            node,
                            loc: getRegexpLocation(bNode),
                            messageId: "unexpected",
                            fix: fixReplaceNode(
                                bNode,
                                `\\k<${bNode.resolved.name}>`,
                            ),
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
