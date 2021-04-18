import type { RegExpVisitor } from "regexpp/visitor"
import type {
    Node as RegExpNode,
    Assertion,
    LookaroundAssertion,
} from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { hasSomeDescendant } from "regexp-ast-analysis"

/**
 * Returns whether the given node is a lookaround.
 */
function isLookaround(node: RegExpNode): node is LookaroundAssertion {
    return (
        node.type === "Assertion" &&
        (node.kind === "lookahead" || node.kind === "lookbehind")
    )
}

/**
 * If the given lookaround only contains a single assertion, then this
 * assertion will be returned.
 */
function getTriviallyNestedAssertion(
    node: LookaroundAssertion,
): Assertion | null {
    const alternatives = node.alternatives
    if (alternatives.length === 1) {
        const elements = alternatives[0].elements
        if (elements.length === 1) {
            const element = elements[0]
            if (element.type === "Assertion") {
                return element
            }
        }
    }

    return null
}

/**
 * Returns the raw of an assertion that is the negation of the given assertion.
 */
function getNegatedRaw(assertion: Assertion): string | null {
    if (assertion.kind === "word") {
        return assertion.negate ? "\\b" : "\\B"
    } else if (assertion.kind === "lookahead") {
        return `(?${assertion.negate ? "=" : "!"}${assertion.raw.slice(3)}`
    } else if (assertion.kind === "lookbehind") {
        return `(?<${assertion.negate ? "=" : "!"}${assertion.raw.slice(4)}`
    }
    return null
}

export default createRule("no-trivially-nested-assertion", {
    meta: {
        docs: {
            description: "disallow trivially nested assertions",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: "Unexpected trivially nested assertion.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor({
            node,
            fixReplaceNode,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onAssertionEnter(aNode) {
                    if (aNode.parent.type === "Quantifier") {
                        // Not all quantifiers are allowed to be the element
                        // of a quantifier, so we don't even try
                        return
                    }

                    if (!isLookaround(aNode)) {
                        // there can be no nesting in predefined assertions
                        return
                    }

                    const nested = getTriviallyNestedAssertion(aNode)
                    if (nested === null) {
                        return
                    }

                    if (
                        aNode.negate &&
                        isLookaround(nested) &&
                        nested.negate &&
                        hasSomeDescendant(
                            nested,
                            (d) => d.type === "CapturingGroup",
                        )
                    ) {
                        // e.g. /(?!(?!(a)))\1/ != /(?=(a))\1/
                        return
                    }

                    const replacement = aNode.negate
                        ? getNegatedRaw(nested)
                        : nested.raw
                    if (replacement === null) {
                        return
                    }

                    context.report({
                        node,
                        loc: getRegexpLocation(aNode),
                        messageId: "unexpected",
                        fix: fixReplaceNode(aNode, replacement),
                    })
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
