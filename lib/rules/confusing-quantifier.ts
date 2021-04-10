import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    getQuantifierOffsets,
    getRegexpLocation,
    quantToString,
} from "../utils"
import { isPotentiallyEmpty } from "regexp-ast-analysis"

export default createRule("confusing-quantifier", {
    meta: {
        docs: {
            description: "disallow about confusing quantifiers",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
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
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            return {
                onQuantifierEnter(qNode) {
                    if (qNode.min > 0 && isPotentiallyEmpty(qNode.element)) {
                        const proposal = quantToString({ ...qNode, min: 0 })
                        context.report({
                            node,
                            loc: getRegexpLocation(
                                sourceCode,
                                node,
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
