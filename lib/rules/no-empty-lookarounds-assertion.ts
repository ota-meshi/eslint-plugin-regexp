import type { Expression } from "estree"
import { isPotentiallyEmpty } from "regexp-ast-analysis"
import type { RegExpVisitor } from "regexpp/visitor"
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"

export default createRule("no-empty-lookarounds-assertion", {
    meta: {
        docs: {
            description:
                "disallow empty lookahead assertion or empty lookbehind assertion",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected:
                "Unexpected empty {{kind}}. It will trivially {{result}} all inputs.",
        },
        type: "suggestion",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            return {
                onAssertionEnter(aNode) {
                    if (
                        aNode.kind !== "lookahead" &&
                        aNode.kind !== "lookbehind"
                    ) {
                        return
                    }

                    if (isPotentiallyEmpty(aNode.alternatives)) {
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, aNode),
                            messageId: "unexpected",
                            data: {
                                kind: aNode.kind,
                                result: aNode.negate ? "reject" : "accept",
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
