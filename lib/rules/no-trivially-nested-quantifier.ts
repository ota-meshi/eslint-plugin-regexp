import type { RegExpVisitor } from "regexpp/visitor"
import type { Group, Quantifier } from "regexpp/ast"
import type { Quant, RegExpContext } from "../utils"
import { quantToString, createRule, defineRegexpVisitor } from "../utils"

/**
 * Returns a new quant which is the combination of both given quantifiers.
 */
function getCombinedQuant(parent: Quantifier, child: Quantifier): Quant | null {
    if (parent.max === 0 || child.max === 0) {
        // other rules deal with this case
        return null
    } else if (parent.greedy === child.greedy) {
        const greedy = parent.greedy

        // Explanation of the following condition:
        //
        // We are currently given a regular expression of the form `(R{a,b}){c,d}` with a<=b, c<=d, b>0, and d>0. The
        // question is: For what numbers a,b,c,d is `(R{a,b}){c,d}` == `R{a*c,b*d}`?
        //
        // Let's reformulate the question in terms of integer intervals. First, some definitions:
        //   x∈[a,b] ⇔ a <= x <= b
        //   [a,b]*x = [a*x, b*x] for x != 0
        //           = [0, 0] for x == 0
        //
        // The question: For what intervals [a, b] and [c, d] is X=Y for
        //   X = [a*c, b*d] and
        //   Y = { x | x ∈ [a,b]*i where i∈[c,d] } ?
        //
        // The first thing to note is that X ⊇ Y, so we only have to show X\Y = ∅. We can think of the elements X\Y
        // as holes in Y. Holes can only appear between intervals [a,b]*j and [a,b]*(j+1), so let's look at a hole h
        // between [a,b]*c and [a,b]*(c+1):
        //
        // 1.  We can see that [a,b]*(c+1) ⊆ Y iff c+1 <= d ⇔ c != d since we are dealing with integers only and know
        //     that c<=d.
        // 2.  h > b*c and h < a*(c+1). Let's just pick h=b*c+1, then we'll get b*c+1 < a*(c+1).
        //
        // The condition for _no_ hole between [a,b]*c and [a,b]*(c+1) is:
        //   c=d ∨ b*c+1 >= a*(c+1)
        //
        // However, this condition is not defined for b=∞ and c=0. Since [a,b]*x = [0, 0] for x == 0, we will just
        // define 0*∞ = 0. It makes sense for our problem, so the condition for b=∞ and c=0 is:
        //   a <= 1
        //
        // Now to proof that it's sufficient to only check for a hole between the first two intervals. We want to show
        // that if h=b*c+1 is not a hole then there will be no j, c<j<d such that b*j+1 is a hole. The first thing to
        // not that j can only exist if c!=d, so the condition for h to not exist simplifies to b*c+1 >= a*(c+1).
        //
        // 1)  b=∞ and c=0:
        //     b*c+1 >= a*(c+1) ⇔ 1 >= a ⇔ a <= 1. If a <= 1, then h does not exist but since b=∞, we know that the
        //     union of the next interval [a, ∞]*1 = [a, ∞] and [0, 0] = [a, ∞]*0 is [0, ∞]. [0, ∞] is the largest
        //     possible interval meaning that there could not possibly be any holes after it. Therefore, a j, c<j<d
        //     cannot exist.
        // 2)  b==∞ and c>0:
        //     b*c+1 >= a*(c+1) ⇔ ∞ >= a*(c+1) is trivially true, so the hole h between [a,b]*c and [a,b]*(c+1) cannot
        //     exist. There can also be no other holes because [a,b]*c = [a*c,∞] ⊇ [a,b]*i = [a*i,∞] for all i>c.
        // 3)  b<∞:
        //     b*c+1 >= a*(c+1). If c+x is also not a hole for any x >= 0, then there can be no holes.
        //     b*(c+x)+1 >= a*(c+x+1) ⇔ b >= a + (a-1)/(c+x). We know that this is true for x=0 and increasing x will
        //     only make (a-1)/(c+x) smaller, so it is always true. Therefore, there can be no j c<j<d such that b*j+1
        //     is a hole.
        //
        // We've shown that if there is no hole h between the first and second interval, then there can be no other
        // holes. Therefore it is sufficient to only check for the first hole.

        const a = child.min
        const b = child.max
        const c = parent.min
        const d = parent.max
        const condition =
            b === Infinity && c === 0
                ? a <= 1
                : c === d || b * c + 1 >= a * (c + 1)

        if (condition) {
            return {
                min: a * c,
                max: b * d,
                greedy,
            }
        }
        return null
    }
    return null
}

/**
 * Given a parent quantifier and a child quantifier, this will return a
 * simplified child quant.
 */
function getSimplifiedChildQuant(
    parent: Quantifier,
    child: Quantifier,
): Quant | null {
    if (parent.max === 0 || child.max === 0) {
        // this rule doesn't handle this
        return null
    } else if (parent.greedy !== child.greedy) {
        // maybe some optimization is possible, but I'm not sure, so let's be safe
        return null
    }
    let min = child.min
    let max = child.max

    if (min === 0 && parent.min === 0) {
        min = 1
    }
    if (parent.max === Infinity && (min === 0 || min === 1) && max > 1) {
        max = 1
    }

    return { min, max, greedy: child.greedy }
}

/**
 * Returns whether the given quantifier is a trivial constant zero or constant
 * one quantifier.
 */
function isTrivialQuantifier(quant: Quantifier): boolean {
    return quant.min === quant.max && (quant.min === 0 || quant.min === 1)
}

/**
 * Iterates over the alternatives of the given group and yields all quantifiers
 * that are the only element of their respective alternative.
 */
function* iterateSingleQuantifiers(group: Group): Iterable<Quantifier> {
    for (const { elements } of group.alternatives) {
        if (elements.length === 1) {
            const single = elements[0]
            if (single.type === "Quantifier") {
                yield single
            }
        }
    }
}

export default createRule("no-trivially-nested-quantifier", {
    meta: {
        docs: {
            description:
                "disallow nested quantifiers that can be rewritten as one quantifier",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            nested:
                "These two quantifiers are trivially nested and can be replaced with '{{quant}}'.",
            childOne: "This nested quantifier can be removed.",
            childSimpler:
                "This nested quantifier can be simplified to '{{quant}}'.",
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
            fixReplaceQuant,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onQuantifierEnter(qNode) {
                    if (isTrivialQuantifier(qNode)) {
                        return
                    }

                    const element = qNode.element
                    if (element.type !== "Group") {
                        return
                    }

                    for (const child of iterateSingleQuantifiers(element)) {
                        if (isTrivialQuantifier(child)) {
                            continue
                        }

                        if (element.alternatives.length === 1) {
                            // only one alternative
                            // let's see whether we can rewrite the quantifier

                            const quant = getCombinedQuant(qNode, child)
                            if (!quant) {
                                continue
                            }

                            const quantStr = quantToString(quant)
                            const replacement = child.element.raw + quantStr

                            context.report({
                                node,
                                loc: getRegexpLocation(qNode),
                                messageId: "nested",
                                data: { quant: quantStr },
                                fix: fixReplaceNode(qNode, replacement),
                            })
                        } else {
                            // this isn't the only child of the parent quantifier

                            const quant = getSimplifiedChildQuant(qNode, child)
                            if (!quant) {
                                continue
                            }

                            if (
                                quant.min === child.min &&
                                quant.max === child.max
                            ) {
                                // quantifier could not be simplified
                                continue
                            }

                            if (quant.min === 1 && quant.max === 1) {
                                context.report({
                                    node,
                                    loc: getRegexpLocation(child),
                                    messageId: "childOne",
                                    // TODO: This fix depends on `qNode`
                                    fix: fixReplaceNode(
                                        child,
                                        child.element.raw,
                                    ),
                                })
                            } else {
                                quant.greedy = undefined

                                context.report({
                                    node,
                                    loc: getRegexpLocation(child),
                                    messageId: "childSimpler",
                                    data: { quant: quantToString(quant) },
                                    // TODO: This fix depends on `qNode`
                                    fix: fixReplaceQuant(child, quant),
                                })
                            }
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
