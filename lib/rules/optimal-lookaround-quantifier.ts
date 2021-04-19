import type { RegExpVisitor } from "regexpp/visitor"
import type { Alternative, LookaroundAssertion, Quantifier } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { hasSomeDescendant } from "regexp-ast-analysis"

/**
 * Extract invalid quantifiers for lookarounds
 */
function* extractInvalidQuantifiers(
    alternatives: Alternative[],
    kind: LookaroundAssertion["kind"],
): IterableIterator<Quantifier> {
    for (const { elements } of alternatives) {
        if (elements.length > 0) {
            const lastIndex = kind === "lookahead" ? elements.length - 1 : 0
            const last = elements[lastIndex]
            switch (last.type) {
                case "Quantifier":
                    if (last.min !== last.max) {
                        if (
                            hasSomeDescendant(
                                last.element,
                                (d) => d.type === "CapturingGroup",
                            )
                        ) {
                            // we can't change the quantifier because it might
                            // affect the capturing group
                        } else {
                            yield last
                        }
                    }
                    break

                case "Group":
                    yield* extractInvalidQuantifiers(last.alternatives, kind)
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
                "The quantified expression '{{expr}}' at the {{endOrStart}} of the expression tree should only be matched a constant number of times. The expression can be removed without affecting the lookaround.",
            replacedWith:
                "The quantified expression '{{expr}}' at the {{endOrStart}} of the expression tree should only be matched a constant number of times. The expression can be replaced with {{replacer}} without affecting the lookaround.",
        },
        type: "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor({
            node,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onAssertionEnter(aNode) {
                    if (
                        aNode.kind === "lookahead" ||
                        aNode.kind === "lookbehind"
                    ) {
                        const endOrStart = END_START_PHRASE[aNode.kind]
                        const quantifiers = extractInvalidQuantifiers(
                            aNode.alternatives,
                            aNode.kind,
                        )

                        for (const q of quantifiers) {
                            const replacer =
                                q.min === 0
                                    ? ""
                                    : q.min === 1
                                    ? `'${q.element.raw}' (no quantifier)`
                                    : `'${q.element.raw}{${q.min}}'`

                            context.report({
                                node,
                                loc: getRegexpLocation(q),
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
