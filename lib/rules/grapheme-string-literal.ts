import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

const segmenter = new Intl.Segmenter()

export default createRule("grapheme-string-literal", {
    meta: {
        docs: {
            description: "enforce single grapheme in string literal",
            category: "Best Practices",
            recommended: false,
        },
        schema: [],
        messages: {
            useSingleGrapheme: "Use single grapheme in string literal.",
        },
        type: "suggestion",
    },
    create(context) {
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation } = regexpContext

            return {
                onStringAlternativeEnter(saNode) {
                    if (saNode.elements.length <= 1) return
                    const string = String.fromCodePoint(
                        ...saNode.elements.map((element) => element.value),
                    )

                    const segments = [...segmenter.segment(string)]
                    if (segments.length > 1) {
                        context.report({
                            node,
                            loc: getRegexpLocation(saNode),
                            messageId: "useSingleGrapheme",
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
