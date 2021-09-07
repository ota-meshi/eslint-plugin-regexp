import { toCharSet } from "regexp-ast-analysis"
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
            recommended: true,
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
            flags,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onCharacterClassEnter(ccNode) {
                    if (!ccNode.negate || ccNode.elements.length !== 1) {
                        return
                    }

                    const element = ccNode.elements[0]
                    if (element.type !== "CharacterSet") {
                        return
                    }

                    if (flags.ignoreCase && element.kind === "property") {
                        // The ignore case canonicalization affects negated
                        // Unicode property escapes in a weird way. In short,
                        // /\p{Foo}/i is not the same as /[^\P{Foo}]/i if
                        // \p{Foo} contains case-varying characters.
                        //
                        // Note: This only affects Unicode property escapes.
                        // All other character sets are either case-invariant
                        // (/./, /\s/, /\d/) or inconsistent (/\w/).

                        const ccSet = toCharSet(ccNode, flags)

                        const negatedElementSet = toCharSet(
                            {
                                ...element,
                                negate: !element.negate,
                            },
                            flags,
                        )

                        if (!ccSet.equals(negatedElementSet)) {
                            // We cannot remove the negative
                            return
                        }
                    }

                    const negatedCharSet = getNegationText(element)
                    context.report({
                        node,
                        loc: getRegexpLocation(ccNode),
                        messageId: "unexpected",
                        data: { negatedCharSet },
                        fix: fixReplaceNode(ccNode, negatedCharSet),
                    })
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
