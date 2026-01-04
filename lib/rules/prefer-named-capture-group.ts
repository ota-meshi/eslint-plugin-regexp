import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils/index.ts"
import { createRule, defineRegexpVisitor } from "../utils/index.ts"
import { mention } from "../utils/mention.ts"

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
