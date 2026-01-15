import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import { isPotentiallyEmpty } from "regexp-ast-analysis"
import type { RegExpContext } from "../utils/index.ts"
import { createRule, defineRegexpVisitor } from "../utils/index.ts"
import {
    quantToString,
    getQuantifierOffsets,
} from "../utils/regexp-ast/index.ts"

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
        function createVisitor({
            node,
            flags,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onQuantifierEnter(qNode) {
                    if (
                        qNode.min > 0 &&
                        isPotentiallyEmpty(qNode.element, flags)
                    ) {
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
