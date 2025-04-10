import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("prefer-named-backreference", {
    meta: {
        docs: {
            description: "enforce using named backreferences",
            category: "Stylistic Issues",
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
        function createVisitor({
            node,
            fixReplaceNode,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onBackreferenceEnter(bNode) {
                    if (
                        !bNode.ambiguous &&
                        bNode.resolved.name &&
                        !bNode.raw.startsWith("\\k<")
                    ) {
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
