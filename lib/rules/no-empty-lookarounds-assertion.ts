import type { Expression } from "estree"
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
            unexpectedLookahead: "Unexpected empty lookahead.",
            unexpectedLookbehind: "Unexpected empty lookbehind.",
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
                    if (
                        aNode.alternatives.every(
                            (alt) => alt.elements.length === 0,
                        )
                    ) {
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, aNode),
                            messageId:
                                aNode.kind === "lookahead"
                                    ? "unexpectedLookahead"
                                    : "unexpectedLookbehind",
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
