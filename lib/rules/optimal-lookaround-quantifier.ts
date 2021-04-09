import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { Alternative, Quantifier } from "regexpp/ast"
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"

/**
 * Extract invalid quantifiers for lookahead
 */
function* extractEndInvalidQuantifiers(
    alternatives: Alternative[],
): IterableIterator<Quantifier> {
    for (const { elements } of alternatives) {
        if (elements.length > 0) {
            const last = elements[elements.length - 1]
            switch (last.type) {
                case "Quantifier":
                    if (last.min !== last.max) {
                        yield last
                    }
                    break

                case "Group":
                    yield* extractEndInvalidQuantifiers(last.alternatives)
                    break

                // we ignore capturing groups on purpose.
                // Example: /(?=(a*))\w+\1/ (no ideal but it illustrates the point)

                default:
                    break
            }
        }
    }
}

/**
 * Extract invalid quantifiers for lookbehind
 */
function* extractStartInvalidQuantifiers(
    alternatives: Alternative[],
): IterableIterator<Quantifier> {
    for (const { elements } of alternatives) {
        if (elements.length > 0) {
            const first = elements[0]
            switch (first.type) {
                case "Quantifier":
                    if (first.min !== first.max) {
                        yield first
                    }
                    break

                case "Group":
                    yield* extractStartInvalidQuantifiers(first.alternatives)
                    break

                // we ignore capturing groups on purpose.
                // Example: /(?=(a*))\w+\1/ (no ideal but it illustrates the point)

                default:
                    break
            }
        }
    }
}

const END_START_PHRASE = {
    lookahead: "end",
    lookbehind: "start",
}

const EXTRACT_INVALID_QUANTIFIERS = {
    lookahead: extractEndInvalidQuantifiers,
    lookbehind: extractStartInvalidQuantifiers,
}

export default createRule("optimal-lookaround-quantifier", {
    meta: {
        docs: {
            description:
                "disallow the alternatives of lookarounds that end with a non-constant quantifier",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
            default: "warn",
        },
        schema: [],
        messages: {
            remove:
                "The quantified expression {{expr}} at the {{endOrStart}} of the expression tree should only be matched a constant number of times. The expression can be removed without affecting the lookaround.",
            replacedWith:
                "The quantified expression {{expr}} at the {{endOrStart}} of the expression tree should only be matched a constant number of times. The expression can be replaced with {{replacer}} without affecting the lookaround.",
        },
        type: "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            return {
                onAssertionEnter(aNode) {
                    if (
                        aNode.kind === "lookahead" ||
                        aNode.kind === "lookbehind"
                    ) {
                        const endOrStart = END_START_PHRASE[aNode.kind]

                        for (const q of EXTRACT_INVALID_QUANTIFIERS[aNode.kind](
                            aNode.alternatives,
                        )) {
                            const replacer =
                                q.min === 0
                                    ? ""
                                    : q.min === 1
                                    ? `${q.element.raw} (no quantifier)`
                                    : `${q.element.raw}{${q.min}}`

                            context.report({
                                node,
                                loc: getRegexpLocation(sourceCode, node, q),
                                messageId:
                                    q.min === 0 ? "remove" : "replacedWith",
                                data: {
                                    expr: q.raw,
                                    endOrStart,
                                    replacer,
                                },
                            })
                        }
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
