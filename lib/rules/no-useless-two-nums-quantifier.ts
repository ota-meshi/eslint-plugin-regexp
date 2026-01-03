import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils/index.ts"
import { createRule, defineRegexpVisitor } from "../utils/index.ts"
import { getQuantifierOffsets } from "../utils/regexp-ast/index.ts"

export default createRule("no-useless-two-nums-quantifier", {
    meta: {
        docs: {
            description: "disallow unnecessary `{n,m}` quantifier",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: "Unexpected quantifier '{{expr}}'.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        function createVisitor({
            node,
            getRegexpLocation,
            fixReplaceQuant,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onQuantifierEnter(qNode) {
                    if (qNode.min === qNode.max) {
                        const [startOffset, endOffset] =
                            getQuantifierOffsets(qNode)
                        const text = qNode.raw.slice(startOffset, endOffset)
                        if (!/^\{\d+,\d+\}$/u.test(text)) {
                            return
                        }
                        context.report({
                            node,
                            loc: getRegexpLocation(qNode, [
                                startOffset,
                                endOffset,
                            ]),
                            messageId: "unexpected",
                            data: {
                                expr: text,
                            },
                            fix: fixReplaceQuant(qNode, `{${qNode.min}}`),
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
