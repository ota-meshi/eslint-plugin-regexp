import { isZeroLength } from "regexp-ast-analysis"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("no-assertion-capturing-group", {
    meta: {
        docs: {
            description: "disallow capturing group that captures assertions.",
            category: "Possible Errors",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected capture assertions.",
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
