import { toUnicodeSet } from "regexp-ast-analysis"
import type {
    CharacterClass,
    CharacterClassElement,
    CharacterUnicodePropertyCharacterSet,
    EscapeCharacterSet,
    ExpressionCharacterClass,
} from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { assertNever } from "../utils/util"

type NegatableCharacterClassElement =
    | CharacterClass
    | ExpressionCharacterClass
    | EscapeCharacterSet
    | CharacterUnicodePropertyCharacterSet

/** Checks whether the given character class is negatable. */
function isNegatableCharacterClassElement<N extends CharacterClassElement>(
    node: N,
): node is N & NegatableCharacterClassElement {
    return (
        node.type === "CharacterClass" ||
        node.type === "ExpressionCharacterClass" ||
        (node.type === "CharacterSet" &&
            (node.kind !== "property" || !node.strings))
    )
}

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
                    if (!isNegatableCharacterClassElement(element)) {
                        return
                    }
                    if (element.type !== "CharacterSet" && !element.negate) {
                        return
                    }

                    if (
                        flags.ignoreCase &&
                        !flags.unicodeSets &&
                        element.type === "CharacterSet" &&
                        element.kind === "property"
                    ) {
                        // The ignore case canonicalization affects negated
                        // Unicode property escapes in a weird way. In short,
                        // /\p{Foo}/i is not the same as /[^\P{Foo}]/i if
                        // \p{Foo} contains case-varying characters.
                        //
                        // Note: This only affects Unicode property escapes.
                        // All other character sets are either case-invariant
                        // (/./, /\s/, /\d/) or inconsistent (/\w/).
                        const ccSet = toUnicodeSet(ccNode, flags)

                        const negatedElementSet = toUnicodeSet(
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
function getNegationText(node: NegatableCharacterClassElement) {
    if (node.type === "CharacterSet") {
        // they are all of the form: /\\[dswp](?:\{[^{}]+\})?/
        let kind = node.raw[1]

        if (kind.toLowerCase() === kind) {
            kind = kind.toUpperCase()
        } else {
            kind = kind.toLowerCase()
        }

        return `\\${kind}${node.raw.slice(2)}`
    }
    if (node.type === "CharacterClass") {
        return `[${node.elements.map((e) => e.raw).join("")}]`
    }
    if (node.type === "ExpressionCharacterClass") {
        return `[${node.raw.slice(2, -1)}]`
    }
    return assertNever(node)
}
