import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import {
    createRule,
    defineRegexpVisitor,
    getQuantifierOffsets,
    quantToString,
} from "../utils"
import { isPotentiallyEmpty } from "regexp-ast-analysis"

export default createRule("confusing-quantifier", {
    meta: {
        docs: {
            description: "disallow confusing quantifiers",
            category: "Best Practices",
            recommended: true,
            default: "warn",
        },
        schema: [],
        messages: {
            confusing:
                "This quantifier is confusing because its minimum is {{min}} but it can match the empty string. Maybe replace it with `{{proposal}}` to reflect that it can match the empty string?",
        },
        type: "problem",
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
                onQuantifierEnter(qNode) {
                    if (qNode.min > 0 && isPotentiallyEmpty(qNode.element)) {
                        const proposal = quantToString({ ...qNode, min: 0 })
                        context.report({
                            node,
                            loc: getRegexpLocation(
                                qNode,
                                getQuantifierOffsets(qNode),
                            ),
                            messageId: "confusing",
                            data: {
                                min: String(qNode.min),
                                proposal,
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
