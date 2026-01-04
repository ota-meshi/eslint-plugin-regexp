import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import { isZeroLength } from "regexp-ast-analysis"
import type { RegExpContext } from "../utils/index.ts"
import { createRule, defineRegexpVisitor } from "../utils/index.ts"

export default createRule("no-empty-capturing-group", {
    meta: {
        docs: {
            description: "disallow capturing group that captures empty.",
            category: "Possible Errors",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected capture empty.",
        },
        type: "suggestion",
    },
    create(context) {
        function createVisitor({
            node,
            flags,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onCapturingGroupEnter(cgNode) {
                    if (isZeroLength(cgNode, flags)) {
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
