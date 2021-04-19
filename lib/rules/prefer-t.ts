import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor, CP_TAB } from "../utils"

export default createRule("prefer-t", {
    meta: {
        docs: {
            description: "enforce using `\\t`",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: "Unexpected character '{{expr}}'. Use '\\t' instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
            arrows: string[],
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation, fixReplaceNode } = regexpContext
            return {
                onCharacterEnter(cNode) {
                    if (
                        cNode.value === CP_TAB &&
                        cNode.raw !== "\\t" &&
                        !arrows.includes(cNode.raw)
                    ) {
                        context.report({
                            node,
                            loc: getRegexpLocation(cNode),
                            messageId: "unexpected",
                            data: {
                                expr: cNode.raw,
                            },
                            fix: fixReplaceNode(cNode, "\\t"),
                        })
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createLiteralVisitor(regexpContext) {
                return createVisitor(regexpContext, [])
            },
            createSourceVisitor(regexpContext) {
                return createVisitor(regexpContext, ["\t"])
            },
        })
    },
})
