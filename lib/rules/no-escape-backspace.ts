import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { CP_BACKSPACE, createRule, defineRegexpVisitor } from "../utils"

export default createRule("no-escape-backspace", {
    meta: {
        docs: {
            description: "disallow escape backspace (`[\\b]`)",
            category: "Possible Errors",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected '[\\b]'. Use '\\u0008' instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor({
            node,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onCharacterEnter(cNode) {
                    if (cNode.value === CP_BACKSPACE && cNode.raw === "\\b") {
                        context.report({
                            node,
                            loc: getRegexpLocation(cNode),
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
