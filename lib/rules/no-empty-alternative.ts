import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    Alternative,
    CapturingGroup,
    Group,
    Pattern,
} from "@eslint-community/regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

/**
 * Returns the source before and after the alternatives of the given capturing group.
 */
function getCapturingGroupOuterSource(node: CapturingGroup): [string, string] {
    const first = node.alternatives[0]
    const last = node.alternatives[node.alternatives.length - 1]

    const innerStart = first.start - node.start
    const innerEnd = last.end - node.start
    return [node.raw.slice(0, innerStart), node.raw.slice(innerEnd)]
}

function getFixedNode(
    regexpNode: CapturingGroup | Group | Pattern,
    alt: Alternative,
): string | null {
    let quant
    if (regexpNode.alternatives.at(0) === alt) {
        quant = "??"
    } else if (regexpNode.alternatives.at(-1) === alt) {
        quant = "?"
    } else {
        return null
    }

    const innerAlternatives = regexpNode.alternatives
        .filter((a) => a !== alt)
        .map((a) => a.raw)
        .join("|")

    let replacement = `(?:${innerAlternatives})${quant}`
    if (regexpNode.type === "CapturingGroup") {
        const [before, after] = getCapturingGroupOuterSource(regexpNode)
        replacement = `${before}${replacement}${after}`
    } else if (regexpNode.parent?.type === "Quantifier") {
        // if the parent is a quantifier, then we need to wrap the replacement
        // in a non-capturing group
        replacement = `(?:${replacement})`
    }

    return replacement
}

export default createRule("no-empty-alternative", {
    meta: {
        docs: {
            description: "disallow alternatives without elements",
            category: "Possible Errors",
            recommended: true,
            default: "warn",
        },
        schema: [],
        hasSuggestions: true,
        messages: {
            empty: "This empty alternative might be a mistake. If not, use a quantifier instead.",
            suggest: "Use a quantifier instead.",
        },
        type: "problem",
    },
    create(context) {
        function createVisitor({
            node,
            getRegexpLocation,
            fixReplaceNode,
        }: RegExpContext): RegExpVisitor.Handlers {
            function verifyAlternatives(
                regexpNode: CapturingGroup | Group | Pattern,
            ) {
                if (regexpNode.alternatives.length >= 2) {
                    // We want to have at least two alternatives because the zero alternatives isn't possible because of
                    // the parser and one alternative is already handled by other rules.
                    for (let i = 0; i < regexpNode.alternatives.length; i++) {
                        const alt = regexpNode.alternatives[i]
                        const isLast = i === regexpNode.alternatives.length - 1
                        if (alt.elements.length === 0) {
                            // Since empty alternative have a width of 0, it's hard to underline their location.
                            // So we will report the location of the `|` that causes the empty alternative.
                            const index = alt.start
                            const loc = isLast
                                ? getRegexpLocation({
                                      start: index - 1,
                                      end: index,
                                  })
                                : getRegexpLocation({
                                      start: index,
                                      end: index + 1,
                                  })

                            const fixed = getFixedNode(regexpNode, alt)

                            context.report({
                                node,
                                loc,
                                messageId: "empty",
                                suggest: fixed
                                    ? [
                                          {
                                              messageId: "suggest",
                                              fix: fixReplaceNode(
                                                  regexpNode,
                                                  fixed,
                                              ),
                                          },
                                      ]
                                    : undefined,
                            })
                            // don't report the same node multiple times
                            return
                        }
                    }
                }
            }

            return {
                onGroupEnter: verifyAlternatives,
                onCapturingGroupEnter: verifyAlternatives,
                onPatternEnter: verifyAlternatives,
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
