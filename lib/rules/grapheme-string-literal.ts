import type { StringAlternative } from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

const segmenter = new Intl.Segmenter()

export default createRule("grapheme-string-literal", {
    meta: {
        docs: {
            description: "enforce single grapheme in string literal",
            category: "Stylistic Issues",
            recommended: false,
        },
        schema: [],
        messages: {
            onlySingleCharacters:
                "Only single characters and graphemes are allowed inside character classes. Use regular alternatives (e.g. `{{alternatives}}`) for strings instead.",
        },
        type: "suggestion",
    },
    create(context) {
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation } = regexpContext

            function isMultipleGraphemes(saNode: StringAlternative) {
                if (saNode.elements.length <= 1) return false
                const string = String.fromCodePoint(
                    ...saNode.elements.map((element) => element.value),
                )

                const segments = [...segmenter.segment(string)]
                return segments.length > 1
            }

            function buildAlternativeExample(saNode: StringAlternative) {
                const alternativeRaws = saNode.parent.alternatives
                    .filter(isMultipleGraphemes)
                    .map((alt) => alt.raw)
                return `(?:${alternativeRaws.join("|")}|[...])`
            }

            return {
                onStringAlternativeEnter(saNode) {
                    if (!isMultipleGraphemes(saNode)) return

                    context.report({
                        node,
                        loc: getRegexpLocation(saNode),
                        messageId: "onlySingleCharacters",
                        data: {
                            alternatives: buildAlternativeExample(saNode),
                        },
                    })
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
