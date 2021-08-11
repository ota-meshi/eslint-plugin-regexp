import { isZeroLength } from "regexp-ast-analysis"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("no-empty-capturing-group", {
    meta: {
        docs: {
            description: "disallow capturing group that captures empty.",
            category: "Possible Errors",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected capture empty.",
        },
        type: "suggestion",
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
                onCapturingGroupEnter(cgNode) {
                    if (isZeroLength(cgNode)) {
                        context.report({
                            node,
                            loc: getRegexpLocation(cgNode),
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
