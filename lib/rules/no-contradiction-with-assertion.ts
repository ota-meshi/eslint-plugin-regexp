import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    Assertion,
    Element,
    Alternative,
    Quantifier,
} from "@eslint-community/regexpp/ast"
import type { RegExpContext } from "../utils"
import { quantToString, createRule, defineRegexpVisitor } from "../utils"
import type {
    FirstLookChar,
    MatchingDirection,
    ReadonlyFlags,
} from "regexp-ast-analysis"
import {
    isPotentiallyEmpty,
    getMatchingDirectionFromAssertionKind,
    getFirstCharAfter,
    getFirstConsumedChar,
    getFirstConsumedCharAfter,
    isZeroLength,
    FirstConsumedChars,
} from "regexp-ast-analysis"
import { mention } from "../utils/mention"

/**
 * Returns whether the given assertions is guaranteed to always trivially
 * reject or accept.
 *
 * @param assertion
 */
function isTrivialAssertion(
    assertion: Assertion,
    dir: MatchingDirection,
    flags: ReadonlyFlags,
): boolean {
    if (assertion.kind !== "word") {
        if (getMatchingDirectionFromAssertionKind(assertion.kind) !== dir) {
            // This assertion doesn't assert anything in that direction, so
            // it's the same as trivially accepting
            return true
        }
    }

    if (assertion.kind === "lookahead" || assertion.kind === "lookbehind") {
        if (isPotentiallyEmpty(assertion.alternatives)) {
            // The assertion is guaranteed to trivially accept/reject.
            return true
        }
    }

    const look = FirstConsumedChars.toLook(
        getFirstConsumedChar(assertion, dir, flags),
    )
    if (look.char.isEmpty || look.char.isAll) {
        // trivially rejecting or accepting (based on the first char)
        return true
    }

    const after = getFirstCharAfter(assertion, dir, flags)
    if (!after.edge) {
        if (look.exact && look.char.isSupersetOf(after.char)) {
            // trivially accepting
            return true
        }

        if (look.char.isDisjointWith(after.char)) {
            // trivially rejecting
            return true
        }
    }

    return false
}

/**
 * Returns the next elements always reachable from the given element without
 * consuming characters
 */
function* getNextElements(
    start: Element,
    dir: MatchingDirection,
): Iterable<Element> {
    let element = start

    for (;;) {
        const parent = element.parent

        if (
            parent.type === "CharacterClass" ||
            parent.type === "CharacterClassRange"
        ) {
            return
        }

        if (parent.type === "Quantifier") {
            if (parent.max === 1) {
                element = parent
                continue
            } else {
                return
            }
        }

        const elements = parent.elements
        const index = elements.indexOf(element)
        const inc = dir === "ltr" ? 1 : -1
        for (let i = index + inc; i >= 0 && i < elements.length; i += inc) {
            const e = elements[i]
            yield e
            if (!isZeroLength(e)) {
                return
            }
        }

        // we have to check the grand parent
        const grandParent = parent.parent

        if (
            (grandParent.type === "Group" ||
                grandParent.type === "CapturingGroup" ||
                (grandParent.type === "Assertion" &&
                    getMatchingDirectionFromAssertionKind(grandParent.kind) !==
                        dir)) &&
            grandParent.alternatives.length === 1
        ) {
            element = grandParent
            continue
        }

        return
    }
}

/**
 * Goes through the given element and all of its children until a the condition
 * returns true or a character is (potentially) consumed.
 */
function tryFindContradictionIn(
    element: Element,
    dir: MatchingDirection,
    condition: (e: Element | Alternative) => boolean,
): boolean {
    if (condition(element)) {
        return true
    }

    if (element.type === "CapturingGroup" || element.type === "Group") {
        // Go into the alternatives of groups
        let some = false
        element.alternatives.forEach((a) => {
            if (tryFindContradictionInAlternative(a, dir, condition)) {
                some = true
            }
        })
        return some
    }

    if (element.type === "Quantifier" && element.max === 1) {
        // Go into the element of quantifiers if their maximum is 1
        return tryFindContradictionIn(element.element, dir, condition)
    }

    if (
        element.type === "Assertion" &&
        (element.kind === "lookahead" || element.kind === "lookbehind") &&
        getMatchingDirectionFromAssertionKind(element.kind) === dir
    ) {
        // Go into the alternatives of lookarounds if they point in the same
        // direction. E.g. ltr and (?=a).
        // Since we don't consume characters, we want to keep going even if we
        // find a contradiction inside the lookaround.
        element.alternatives.forEach((a) =>
            tryFindContradictionInAlternative(a, dir, condition),
        )
    }

    return false
}

/**
 * Goes through all elements of the given alternative until the condition
 * returns true or a character is (potentially) consumed.
 */
function tryFindContradictionInAlternative(
    alternative: Alternative,
    dir: MatchingDirection,
    condition: (e: Element | Alternative) => boolean,
): boolean {
    if (condition(alternative)) {
        return true
    }

    const { elements } = alternative

    const first = dir === "ltr" ? 0 : elements.length
    const inc = dir === "ltr" ? 1 : -1
    for (let i = first; i >= 0 && i < elements.length; i += inc) {
        const e = elements[i]
        if (tryFindContradictionIn(e, dir, condition)) {
            return true
        }
        if (!isZeroLength(e)) {
            break
        }
    }

    return false
}

/**
 * Returns whether the 2 look chars are disjoint (== mutually exclusive).
 */
function disjoint(a: FirstLookChar, b: FirstLookChar): boolean {
    if (a.edge && b.edge) {
        // both accept the edge
        return false
    }
    return a.char.isDisjointWith(b.char)
}

export default createRule("no-contradiction-with-assertion", {
    meta: {
        docs: {
            description: "disallow elements that contradict assertions",
            category: "Possible Errors",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        schema: [],
        messages: {
            alternative:
                "The alternative {{ alt }} can never be entered because it contradicts with the assertion {{ assertion }}. Either change the alternative or assertion to resolve the contradiction.",
            cannotEnterQuantifier:
                "The quantifier {{ quant }} can never be entered because its element contradicts with the assertion {{ assertion }}. Change or remove the quantifier or change the assertion to resolve the contradiction.",
            alwaysEnterQuantifier:
                "The quantifier {{ quant }} is always entered despite having a minimum of 0. This is because the assertion {{ assertion }} contradicts with the element(s) after the quantifier. Either set the minimum to 1 ({{ newQuant }}) or change the assertion.",

            // suggestions

            removeQuantifier: "Remove the quantifier.",
            changeQuantifier: "Change the quantifier to {{ newQuant }}.",
        },
        hasSuggestions: true,
        type: "problem",
    },
    create(context) {
        /** Create visitor */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const {
                node,
                flags,
                getRegexpLocation,
                fixReplaceQuant,
                fixReplaceNode,
            } = regexpContext

            /** Analyses the given assertion. */
            function analyseAssertion(
                assertion: Assertion,
                dir: MatchingDirection,
            ) {
                if (isTrivialAssertion(assertion, dir, flags)) {
                    return
                }

                const assertionLook = FirstConsumedChars.toLook(
                    getFirstConsumedChar(assertion, dir, flags),
                )

                for (const element of getNextElements(assertion, dir)) {
                    if (tryFindContradictionIn(element, dir, contradicts)) {
                        break
                    }
                }

                /** Whether the alternative contradicts the current assertion. */
                function contradictsAlternative(
                    alternative: Alternative,
                ): boolean {
                    let consumed = getFirstConsumedChar(alternative, dir, flags)
                    if (consumed.empty) {
                        // This means that we also have to look at the
                        // characters after the alternative.
                        consumed = FirstConsumedChars.concat(
                            [
                                consumed,
                                getFirstConsumedCharAfter(
                                    alternative,
                                    dir,
                                    flags,
                                ),
                            ],
                            flags,
                        )
                    }

                    const look = FirstConsumedChars.toLook(consumed)

                    if (disjoint(assertionLook, look)) {
                        context.report({
                            node,
                            loc: getRegexpLocation(alternative),
                            messageId: "alternative",
                            data: {
                                assertion: mention(assertion),
                                alt: mention(alternative),
                            },
                        })
                        return true
                    }

                    return false
                }

                /** Whether the alternative contradicts the current assertion. */
                function contradictsQuantifier(quant: Quantifier): boolean {
                    if (quant.max === 0) {
                        return false
                    }
                    if (quant.min !== 0) {
                        // all the below condition assume min=0
                        return false
                    }

                    const consumed = getFirstConsumedChar(
                        quant.element,
                        dir,
                        flags,
                    )
                    const look = FirstConsumedChars.toLook(consumed)

                    if (disjoint(assertionLook, look)) {
                        // This means that we cannot enter the quantifier
                        // e.g. /(?!a)a*b/
                        context.report({
                            node,
                            loc: getRegexpLocation(quant),
                            messageId: "cannotEnterQuantifier",
                            data: {
                                assertion: mention(assertion),
                                quant: mention(quant),
                            },
                            suggest: [
                                {
                                    messageId: "removeQuantifier",
                                    fix: fixReplaceNode(quant, ""),
                                },
                            ],
                        })
                        return true
                    }

                    const after = getFirstCharAfter(quant, dir, flags)

                    if (disjoint(assertionLook, after)) {
                        // This means that we always have to enter the quantifier
                        // e.g. /(?!a)b*a/
                        const newQuant = quantToString({ ...quant, min: 1 })
                        context.report({
                            node,
                            loc: getRegexpLocation(quant),
                            messageId: "alwaysEnterQuantifier",
                            data: {
                                assertion: mention(assertion),
                                quant: mention(quant),
                                newQuant,
                            },
                            suggest: [
                                {
                                    messageId: "changeQuantifier",
                                    data: { newQuant },
                                    fix: fixReplaceQuant(quant, {
                                        min: 1,
                                        max: quant.max,
                                    }),
                                },
                            ],
                        })
                        return true
                    }

                    return false
                }

                /** Whether the element contradicts the current assertion. */
                function contradicts(element: Element | Alternative): boolean {
                    if (element.type === "Alternative") {
                        return contradictsAlternative(element)
                    } else if (element.type === "Quantifier") {
                        return contradictsQuantifier(element)
                    }

                    return false
                }
            }

            return {
                onAssertionEnter(assertion) {
                    analyseAssertion(assertion, "ltr")
                    analyseAssertion(assertion, "rtl")
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
