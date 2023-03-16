import { matchesNoCharacters } from "regexp-ast-analysis"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("no-empty-character-class", {
    meta: {
        docs: {
            description: "disallow character classes that match no characters",
            category: "Possible Errors",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        schema: [],
        messages: {
            empty: "This character class matches no characters because it is empty.",
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
                                ? "cannotMatchAny"
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
