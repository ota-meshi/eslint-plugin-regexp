import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor, CP_BACK_SLASH } from "../utils"

export default createRule("no-standalone-backslash", {
    meta: {
        docs: {
            description: "disallow standalone backslashes (`\\`)",
            category: "Best Practices",
            recommended: false, //  `regexp/strict` rule meets this rule.
        },
        schema: [],
        messages: {
            unexpected:
                "Unexpected standalone backslash (`\\`). It looks like an escape sequence, but it's a single `\\` character pattern.",
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
                    if (cNode.value === CP_BACK_SLASH && cNode.raw === "\\") {
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
