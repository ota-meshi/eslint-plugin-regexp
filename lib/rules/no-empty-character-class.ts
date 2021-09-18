import { matchesNoCharacters } from "regexp-ast-analysis"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("no-empty-character-class", {
    meta: {
        docs: {
            description:
                "disallow character classes that does not match all characters",
            category: "Possible Errors",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        schema: [],
        messages: {
            empty:
                "Since this character class is empty, it cannot match all characters.",
            cannotMatchAny: "This character class cannot match any characters.",
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
            const { node, getRegexpLocation, flags } = regexpContext

            return {
                onCharacterClassEnter(ccNode) {
                    if (matchesNoCharacters(ccNode, flags)) {
                        context.report({
                            node,
                            loc: getRegexpLocation(ccNode),
                            messageId: ccNode.elements.length
                                ? "cannotMatchAll"
                                : "empty",
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
