import type {
    EscapeCharacterSet,
    UnicodePropertyCharacterSet,
} from "regexpp/ast"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("negation", {
    meta: {
        docs: {
            description: "enforce use of escapes on negation",
            category: "Best Practices",
            // TODO In the major version
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                "Unexpected negated character class. Use '{{negatedCharSet}}' instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor({
            node,
            getRegexpLocation,
            fixReplaceNode,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onCharacterClassEnter(ccNode) {
                    if (!ccNode.negate || ccNode.elements.length !== 1) {
                        return
                    }
                    const element = ccNode.elements[0]
                    if (element.type === "CharacterSet") {
                        const negatedCharSet = getNegationText(element)
                        context.report({
                            node,
                            loc: getRegexpLocation(ccNode),
                            messageId: "unexpected",
                            data: { negatedCharSet },
                            fix: fixReplaceNode(ccNode, negatedCharSet),
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

/**
 * Gets the text that negation the CharacterSet.
 */
function getNegationText(
    node: EscapeCharacterSet | UnicodePropertyCharacterSet,
) {
    // they are all of the form: /\\[dswp](?:\{[^{}]+\})?/
    let kind = node.raw[1]

    if (kind.toLowerCase() === kind) {
        kind = kind.toUpperCase()
    } else {
        kind = kind.toLowerCase()
    }

    return `\\${kind}${node.raw.slice(2)}`
}
