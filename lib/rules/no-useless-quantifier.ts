import type { Rule } from "eslint"
import type { RegExpVisitor } from "regexpp/visitor"
import type { Quantifier } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { canUnwrapped, createRule, defineRegexpVisitor } from "../utils"
import { isEmpty, isPotentiallyEmpty, isZeroLength } from "regexp-ast-analysis"

export default createRule("no-useless-quantifier", {
    meta: {
        docs: {
            description: "disallow quantifiers that can be removed",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            constOne: "Unexpected useless quantifier.",
            empty:
                "Unexpected useless quantifier. The quantified element doesn't consume or assert characters.",
            emptyQuestionMark:
                "Unexpected useless quantifier. The quantified element can already accept the empty string, so this quantifier is redundant.",
            zeroLength:
                "Unexpected useless quantifier. The quantified element doesn't consume characters.",

            // suggestions
            remove: "Remove the '{{quant}}' quantifier.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation, fixReplaceNode } = regexpContext

            /**
             * Returns a fix that replaces the given quantifier with its
             * quantified element
             */
            function fixRemoveQuant(qNode: Quantifier) {
                return fixReplaceNode(qNode, () => {
                    const text = qNode.element.raw
                    return canUnwrapped(qNode, text) ? text : null
                })
            }

            /**
             * Returns a suggestion that replaces the given quantifier with its
             * quantified element
             */
            function suggestRemoveQuant(
                qNode: Quantifier,
            ): Rule.SuggestionReportDescriptor {
                const quant = qNode.raw.slice(qNode.element.end - qNode.start)

                return {
                    messageId: "remove",
                    data: { quant },
                    fix: fixReplaceNode(qNode, () => {
                        const text = qNode.element.raw
                        return canUnwrapped(qNode, text) ? text : null
                    }),
                }
            }

            return {
                onQuantifierEnter(qNode) {
                    // trivial case
                    // e.g. a{1}
                    if (qNode.min === 1 && qNode.max === 1) {
                        context.report({
                            node,
                            loc: getRegexpLocation(qNode),
                            messageId: "constOne",
                            fix: fixRemoveQuant(qNode),
                        })
                        return
                    }

                    // the quantified element already accepts the empty string
                    // e.g. (||)*
                    if (isEmpty(qNode.element)) {
                        context.report({
                            node,
                            loc: getRegexpLocation(qNode),
                            messageId: "empty",
                            suggest: [suggestRemoveQuant(qNode)],
                        })
                        return
                    }

                    // the quantified element already accepts the empty string
                    // e.g. (a?)?
                    if (
                        qNode.min === 0 &&
                        qNode.max === 1 &&
                        qNode.greedy &&
                        isPotentiallyEmpty(qNode.element)
                    ) {
                        context.report({
                            node,
                            loc: getRegexpLocation(qNode),
                            messageId: "emptyQuestionMark",
                            suggest: [suggestRemoveQuant(qNode)],
                        })
                        return
                    }

                    // the quantified is zero length
                    // e.g. (\b){5}
                    if (qNode.min >= 1 && isZeroLength(qNode.element)) {
                        context.report({
                            node,
                            loc: getRegexpLocation(qNode),
                            messageId: "zeroLength",
                            suggest: [suggestRemoveQuant(qNode)],
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
