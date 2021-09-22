import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { mention } from "../utils/mention"

export default createRule("prefer-named-capture-group", {
    meta: {
        docs: {
            description: "enforce using named capture groups",
            category: "Stylistic Issues",
            recommended: false,
        },
        schema: [],
        messages: {
            required:
                "Capture group {{group}} should be converted to a named or non-capturing group.",
        },
        type: "suggestion",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation } = regexpContext

            return {
                onCapturingGroupEnter(cgNode) {
                    if (cgNode.name === null) {
                        context.report({
                            node,
                            loc: getRegexpLocation(cgNode),
                            messageId: "required",
                            data: {
                                group: mention(cgNode),
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
