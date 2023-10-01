import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("no-empty-string-literal", {
    meta: {
        docs: {
            description: "disallow empty string literals in character classes",
            category: "Best Practices",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected empty string literal.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation } = regexpContext

            return {
                onClassStringDisjunctionEnter(csdNode) {
                    if (
                        csdNode.alternatives.every(
                            (alt) => alt.elements.length === 0,
                        )
                    ) {
                        context.report({
                            node,
                            loc: getRegexpLocation(csdNode),
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
