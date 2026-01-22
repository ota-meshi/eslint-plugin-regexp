import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { Rule } from "eslint"
import { hasSomeDescendant } from "regexp-ast-analysis"
import type { RegExpContext } from "../utils/index.ts"
import {
    canUnwrapped,
    createRule,
    defineRegexpVisitor,
} from "../utils/index.ts"

export default createRule("no-zero-quantifier", {
    meta: {
        docs: {
            description: "disallow quantifiers with a maximum of zero",
            category: "Best Practices",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected:
                "Unexpected zero quantifier. The quantifier and its quantified element can be removed without affecting the pattern.",
            withCapturingGroup:
                "Unexpected zero quantifier. The quantifier and its quantified element do not affecting the pattern. Try to remove the elements but be careful because it contains at least one capturing group.",

            // suggestions
            remove: "Remove this zero quantifier.",
        },
        type: "suggestion", // "problem",
        hasSuggestions: true,
    },
    create(context) {
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation, fixReplaceNode, patternAst } =
                regexpContext

            return {
                onQuantifierEnter(qNode) {
                    if (qNode.max === 0) {
                        const containCapturingGroup = hasSomeDescendant(
                            qNode,
                            (n) => n.type === "CapturingGroup",
                        )

                        if (containCapturingGroup) {
                            context.report({
                                node,
                                loc: getRegexpLocation(qNode),
                                messageId: "withCapturingGroup",
                            })
                        } else {
                            const suggest: Rule.SuggestionReportDescriptor[] =
                                []
                            if (patternAst.raw === qNode.raw) {
                                suggest.push({
                                    messageId: "remove",
                                    fix: fixReplaceNode(qNode, "(?:)"),
                                })
                            } else if (canUnwrapped(qNode, "")) {
                                suggest.push({
                                    messageId: "remove",
                                    fix: fixReplaceNode(qNode, ""),
                                })
                            }

                            context.report({
                                node,
                                loc: getRegexpLocation(qNode),
                                messageId: "unexpected",
                                suggest,
                            })
                        }
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
