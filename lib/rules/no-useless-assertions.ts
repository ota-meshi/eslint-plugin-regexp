import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    Alternative,
    Assertion,
    EdgeAssertion,
    Element,
    LookaroundAssertion,
    Node,
    Pattern,
    WordBoundaryAssertion,
} from "@eslint-community/regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import type {
    MatchingDirection,
    ReadonlyFlags,
    FirstLookChar,
} from "regexp-ast-analysis"
import {
    Chars,
    getFirstCharAfter,
    getFirstConsumedChar,
    getLengthRange,
    getMatchingDirectionFromAssertionKind,
    hasSomeDescendant,
    isPotentiallyEmpty,
    isZeroLength,
    FirstConsumedChars,
    invertMatchingDirection,
} from "regexp-ast-analysis"
import { mention } from "../utils/mention"
import { assertNever } from "../utils/util"

function containsAssertion(n: Node): boolean {
    return hasSomeDescendant(n, (d) => d.type === "Assertion")
}

/**
 * Returns whether the given lookaround asserts exactly one character in the given direction.
 */
function isSingleCharacterAssertion(
    assertion: Assertion,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): boolean {
    switch (assertion.kind) {
        case "word":
            // \b and \B assert one character in BOTH directions
            return false

        case "start":
            return direction === "rtl"
        case "end":
            return direction === "ltr"

        default:
            break
    }

    if (getMatchingDirectionFromAssertionKind(assertion.kind) !== direction) {
        return false
    }

    return assertion.alternatives.every((alt) => {
        if (!containsAssertion(alt)) {
            // if we don't contains assertions, then we can only need to check
            // the length range of the consumed characters
            const range = getLengthRange(alt, flags)
            return range.min === 1 && range.max === 1
        }

        // now it gets tricky
        // e.g. (?=(?=[a-z])\w(?<=[a-g])) is a single character assertion

        let consumed = false
        let asserted = false
        const elements =
            direction === "ltr" ? alt.elements : [...alt.elements].reverse()
        for (const e of elements) {
            if (!consumed) {
                // before we consumed our first (and only) character, we can
                // have single character assertions

                if (
                    e.type === "Assertion" &&
                    isSingleCharacterAssertion(e, direction, flags)
                ) {
                    asserted = true
                    continue
                }

                if (containsAssertion(e)) {
                    // too complex to reason about, so we just give up
                    return false
                }

                const range = getLengthRange(e, flags)
                if (range.max === 0) {
                    // we haven't consumed anything, so onto the next one
                    continue
                } else if (range.min === 1 && range.max === 1) {
                    // finally, a character
                    consumed = true
                } else {
                    // it's not exactly a single character
                    return false
                }
            } else {
                // since we already consumed our first (and only) character, we
                // can at most have assertions in the direction of the
                // first character

                const otherDir = invertMatchingDirection(direction)
                if (
                    e.type === "Assertion" &&
                    isSingleCharacterAssertion(e, otherDir, flags)
                ) {
                    continue
                }

                return false
            }
        }

        return consumed || asserted
    })
}

/**
 * Combines 2 look chars such that the result is equivalent to 2 adjacent
 * assertions `(?=a)(?=b)`.
 */
function firstLookCharsIntersection(
    a: FirstLookChar,
    b: FirstLookChar,
): FirstLookChar {
    const char = a.char.intersect(b.char)
    return {
        char: a.char.intersect(b.char),
        exact: (a.exact && b.exact) || char.isEmpty,
        edge: a.edge && b.edge,
    }
}

type GetFirstCharAfter = (
    afterThis: Assertion,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
) => FirstLookChar

/**
 * Creates a {@link GetFirstCharAfter} function that will reorder assertions to
 * get the maximum information after the characters after the given assertions.
 *
 * Conceptually, this will reorder adjacent assertions such that given
 * assertion is moved as far as possible in the opposite direction of natural
 * matching direction. E.g. when given `$` in `a(?!a)(?<=\w)$`, the characters
 * after `$` will be returned as if the pattern was `a$(?!a)(?<=\w)`.
 *
 * @param forbidden A list of assertions that may not be reordered.
 */
function createReorderingGetFirstCharAfter(
    forbidden: ReadonlySet<Assertion>,
): GetFirstCharAfter {
    /** Whether the given element or one of its descendants is forbidden. */
    function hasForbidden(element: Element): boolean {
        if (element.type === "Assertion" && forbidden.has(element)) {
            return true
        }
        for (const f of forbidden) {
            if (hasSomeDescendant(element, f)) {
                return true
            }
        }
        return false
    }

    return (afterThis, direction, flags) => {
        let result = getFirstCharAfter(afterThis, direction, flags)

        if (afterThis.parent.type === "Alternative") {
            const { elements } = afterThis.parent

            const inc = direction === "ltr" ? -1 : +1
            const start = elements.indexOf(afterThis)
            for (let i = start + inc; i >= 0 && i < elements.length; i += inc) {
                const other = elements[i]
                if (!isZeroLength(other, flags)) {
                    break
                }
                if (hasForbidden(other)) {
                    // we hit an element that cannot be reordered
                    break
                }

                const otherResult = FirstConsumedChars.toLook(
                    getFirstConsumedChar(other, direction, flags),
                )

                result = firstLookCharsIntersection(result, otherResult)
            }
        }

        return result
    }
}

function removeAlternative(
    alternative: Alternative,
): [Element | Pattern, string] {
    const parent = alternative.parent
    if (parent.alternatives.length > 1) {
        // we can just remove the alternative
        let { start, end } = alternative
        if (parent.alternatives[0] === alternative) {
            end++
        } else {
            start--
        }
        const before = parent.raw.slice(0, start - parent.start)
        const after = parent.raw.slice(end - parent.start)
        return [parent, before + after]
    }

    // we have to remove the parent as well

    switch (parent.type) {
        case "Pattern":
            return [parent, "[]"]

        case "Assertion": {
            // the inner part of the assertion always rejects
            const assertionParent = parent.parent
            if (parent.negate) {
                // the assertion always accepts
                return [
                    assertionParent.type === "Quantifier"
                        ? assertionParent
                        : parent,
                    "",
                ]
            }
            if (assertionParent.type === "Quantifier") {
                if (assertionParent.min === 0) {
                    return [assertionParent, ""]
                }
                return removeAlternative(assertionParent.parent)
            }
            return removeAlternative(assertionParent)
        }

        case "CapturingGroup": {
            // we don't remove capturing groups
            const before = parent.raw.slice(0, alternative.start - parent.start)
            const after = parent.raw.slice(alternative.end - parent.start)
            return [parent, `${before}[]${after}`]
        }

        case "Group": {
            const groupParent = parent.parent
            if (groupParent.type === "Quantifier") {
                if (groupParent.min === 0) {
                    return [groupParent, ""]
                }
                return removeAlternative(groupParent.parent)
            }
            return removeAlternative(groupParent)
        }

        default:
            return assertNever(parent)
    }
}

const messages = {
    alwaysRejectByChar:
        "{{assertion}} will always reject because it is {{followedOrPreceded}} by a character.",
    alwaysAcceptByChar:
        "{{assertion}} will always accept because it is never {{followedOrPreceded}} by a character.",
    alwaysRejectByNonLineTerminator:
        "{{assertion}} will always reject because it is {{followedOrPreceded}} by a non-line-terminator character.",
    alwaysAcceptByLineTerminator:
        "{{assertion}} will always accept because it is {{followedOrPreceded}} by a line-terminator character.",
    alwaysAcceptByLineTerminatorOrEdge:
        "{{assertion}} will always accept because it is {{followedOrPreceded}} by a line-terminator character or the {{startOrEnd}} of the input string.",
    alwaysAcceptOrRejectFollowedByWord:
        "{{assertion}} will always {{acceptOrReject}} because it is preceded by a non-word character and followed by a word character.",
    alwaysAcceptOrRejectFollowedByNonWord:
        "{{assertion}} will always {{acceptOrReject}} because it is preceded by a non-word character and followed by a non-word character.",
    alwaysAcceptOrRejectPrecededByWordFollowedByNonWord:
        "{{assertion}} will always {{acceptOrReject}} because it is preceded by a word character and followed by a non-word character.",
    alwaysAcceptOrRejectPrecededByWordFollowedByWord:
        "{{assertion}} will always {{acceptOrReject}} because it is preceded by a word character and followed by a word character.",
    alwaysForLookaround:
        "The {{kind}} {{assertion}} will always {{acceptOrReject}}.",
    alwaysForNegativeLookaround:
        "The negative {{kind}} {{assertion}} will always {{acceptOrReject}}.",

    acceptSuggestion: "Remove the assertion. (Replace with empty string.)",
    rejectSuggestion:
        "Remove branch of the assertion. (Replace with empty set.)",
}

export default createRule("no-useless-assertions", {
    meta: {
        docs: {
            description:
                "disallow assertions that are known to always accept (or reject)",
            category: "Possible Errors",
            recommended: true,
        },
        hasSuggestions: true,
        schema: [],
        messages,
        type: "problem",
    },
    create(context) {
        function createVisitor({
            node,
            flags,
            getRegexpLocation,
            fixReplaceNode,
        }: RegExpContext): RegExpVisitor.Handlers {
            const reported = new Set<Assertion>()

            function replaceWithEmptyString(assertion: Assertion) {
                if (assertion.parent.type === "Quantifier") {
                    // the assertion always accepts does not consume characters, we can remove the quantifier as well.
                    return fixReplaceNode(assertion.parent, "")
                }
                return fixReplaceNode(assertion, "")
            }

            function replaceWithEmptySet(assertion: Assertion) {
                if (assertion.parent.type === "Quantifier") {
                    if (assertion.parent.min === 0) {
                        // the assertion always rejects does not consume characters, we can remove the quantifier as well.
                        return fixReplaceNode(assertion.parent, "")
                    }
                    const [element, replacement] = removeAlternative(
                        assertion.parent.parent,
                    )
                    return fixReplaceNode(element, replacement)
                }
                const [element, replacement] = removeAlternative(
                    assertion.parent,
                )
                return fixReplaceNode(element, replacement)
            }

            function report(
                assertion: Assertion,
                messageId: keyof typeof messages,
                data: Record<string, string> & {
                    acceptOrReject: "accept" | "reject"
                },
            ) {
                reported.add(assertion)
                const { acceptOrReject } = data

                context.report({
                    node,
                    loc: getRegexpLocation(assertion),
                    messageId,
                    data: {
                        assertion: mention(assertion),
                        ...data,
                    },
                    suggest: [
                        {
                            messageId: `${acceptOrReject}Suggestion`,
                            fix:
                                acceptOrReject === "accept"
                                    ? replaceWithEmptyString(assertion)
                                    : replaceWithEmptySet(assertion),
                        },
                    ],
                })
            }

            /**
             * Verify for `^` or `$`
             */
            function verifyStartOrEnd(
                assertion: EdgeAssertion,
                getFirstCharAfterFn: GetFirstCharAfter,
            ): void {
                // Note: /^/ is the same as /(?<!.)/s and /^/m is the same as /(?<!.)/
                // Note: /$/ is the same as /(?!.)/s and /$/m is the same as /(?!.)/

                // get the "next" character
                const direction = getMatchingDirectionFromAssertionKind(
                    assertion.kind,
                )
                const next = getFirstCharAfterFn(assertion, direction, flags)

                const followedOrPreceded =
                    assertion.kind === "end" ? "followed" : "preceded"

                const lineTerminator = Chars.lineTerminator(flags)

                if (next.edge) {
                    // the string might start/end after the assertion

                    if (!flags.multiline) {
                        // ^/$ will always accept at an edge with no char before/after it
                        if (next.char.isEmpty) {
                            report(assertion, "alwaysAcceptByChar", {
                                followedOrPreceded,
                                acceptOrReject: "accept",
                            })
                        }
                    } else {
                        // ^/$ will always accept at an edge or line terminator before/after it
                        if (next.char.isSubsetOf(lineTerminator)) {
                            report(
                                assertion,
                                "alwaysAcceptByLineTerminatorOrEdge",
                                {
                                    followedOrPreceded,
                                    startOrEnd: assertion.kind,
                                    acceptOrReject: "accept",
                                },
                            )
                        }
                    }
                } else {
                    // there is always some character of `node`

                    if (!flags.multiline) {
                        // since the m flag isn't present any character will result in trivial rejection
                        report(assertion, "alwaysRejectByChar", {
                            followedOrPreceded,
                            acceptOrReject: "reject",
                        })
                    } else {
                        // only if the character is a sub set of /./, will the assertion trivially reject

                        if (next.char.isDisjointWith(lineTerminator)) {
                            report(
                                assertion,
                                "alwaysRejectByNonLineTerminator",
                                {
                                    followedOrPreceded,
                                    acceptOrReject: "reject",
                                },
                            )
                        } else if (next.char.isSubsetOf(lineTerminator)) {
                            report(assertion, "alwaysAcceptByLineTerminator", {
                                followedOrPreceded,
                                acceptOrReject: "accept",
                            })
                        }
                    }
                }
            }

            /**
             * Verify for `\b` or `\B`
             */
            function verifyWordBoundary(
                assertion: WordBoundaryAssertion,
                getFirstCharAfterFn: GetFirstCharAfter,
            ): void {
                const word = Chars.word(flags)

                const next = getFirstCharAfterFn(assertion, "ltr", flags)
                const prev = getFirstCharAfterFn(assertion, "rtl", flags)

                const nextIsWord = next.char.isSubsetOf(word) && !next.edge
                const prevIsWord = prev.char.isSubsetOf(word) && !prev.edge
                const nextIsNonWord = next.char.isDisjointWith(word)
                const prevIsNonWord = prev.char.isDisjointWith(word)

                // Note: /\b/ == /(?:(?<!\w)(?=\w)|(?<=\w)(?!\w))/  (other flags may apply)

                // the idea here is that \B accepts when \b reject and vise versa.
                const accept = assertion.negate ? "reject" : "accept"
                const reject = assertion.negate ? "accept" : "reject"

                if (prevIsNonWord) {
                    // current branch: /(?<!\w)(?=\w)/

                    if (nextIsWord) {
                        report(
                            assertion,
                            "alwaysAcceptOrRejectFollowedByWord",
                            {
                                acceptOrReject: accept,
                            },
                        )
                    }
                    if (nextIsNonWord) {
                        report(
                            assertion,
                            "alwaysAcceptOrRejectFollowedByNonWord",
                            {
                                acceptOrReject: reject,
                            },
                        )
                    }
                }
                if (prevIsWord) {
                    // current branch: /(?<=\w)(?!\w)/

                    if (nextIsNonWord) {
                        report(
                            assertion,
                            "alwaysAcceptOrRejectPrecededByWordFollowedByNonWord",
                            {
                                acceptOrReject: accept,
                            },
                        )
                    }
                    if (nextIsWord) {
                        report(
                            assertion,
                            "alwaysAcceptOrRejectPrecededByWordFollowedByWord",
                            {
                                acceptOrReject: reject,
                            },
                        )
                    }
                }
            }

            /**
             * Verify for LookaroundAssertion
             */
            function verifyLookaround(
                assertion: LookaroundAssertion,
                getFirstCharAfterFn: GetFirstCharAfter,
            ): void {
                if (isPotentiallyEmpty(assertion.alternatives, flags)) {
                    // we don't handle trivial accept/reject based on emptiness
                    return
                }

                const direction = getMatchingDirectionFromAssertionKind(
                    assertion.kind,
                )
                const after = getFirstCharAfterFn(assertion, direction, flags)

                const firstOf = FirstConsumedChars.toLook(
                    getFirstConsumedChar(
                        assertion.alternatives,
                        direction,
                        flags,
                    ),
                )

                // the idea here is that a negate lookaround accepts when non-negated version reject and vise versa.
                const accept = assertion.negate ? "reject" : "accept"
                const reject = assertion.negate ? "accept" : "reject"

                // Careful now! If exact is false, we are only guaranteed to have a superset of the actual character.
                // False negatives are fine but we can't have false positives.

                if (
                    after.char.isDisjointWith(firstOf.char) &&
                    !(after.edge && firstOf.edge)
                ) {
                    report(
                        assertion,
                        assertion.negate
                            ? "alwaysForNegativeLookaround"
                            : "alwaysForLookaround",
                        {
                            kind: assertion.kind,
                            acceptOrReject: reject,
                        },
                    )
                }

                // We can only decide the accept case for exact single-character assertions.
                // We want the character after the assertion to be a subset of the asserted characters. For this to be
                // correct, the set of assertion characters needs to be exact. We also have to consider edges. Edges
                // can be thought of as a special character, so the same subset requirement applies.
                const edgeSubset = firstOf.edge || !after.edge
                if (
                    firstOf.exact &&
                    edgeSubset &&
                    after.char.isSubsetOf(firstOf.char) &&
                    isSingleCharacterAssertion(
                        assertion,
                        getMatchingDirectionFromAssertionKind(assertion.kind),
                        flags,
                    )
                ) {
                    report(
                        assertion,
                        assertion.negate
                            ? "alwaysForNegativeLookaround"
                            : "alwaysForLookaround",
                        {
                            kind: assertion.kind,
                            acceptOrReject: accept,
                        },
                    )
                }
            }

            /**
             * Verify for Assertion
             */
            function verifyAssertion(
                assertion: Assertion,
                getFirstCharAfterFn: GetFirstCharAfter,
            ): void {
                switch (assertion.kind) {
                    case "start":
                    case "end":
                        verifyStartOrEnd(assertion, getFirstCharAfterFn)
                        break

                    case "word":
                        verifyWordBoundary(assertion, getFirstCharAfterFn)
                        break

                    case "lookahead":
                    case "lookbehind":
                        verifyLookaround(assertion, getFirstCharAfterFn)
                        break
                    default:
                        throw assertNever(assertion)
                }
            }

            const allAssertions: Assertion[] = []

            return {
                onAssertionEnter(assertion) {
                    // Phase 1:
                    // The context of assertions is determined by only looking
                    // at elements after the current assertion. This means that
                    // the order of assertions is kept as is.
                    verifyAssertion(assertion, getFirstCharAfter)

                    // store all assertions for the second phase
                    allAssertions.push(assertion)
                },
                onPatternLeave() {
                    // Phase 2:
                    // The context of assertions is determined by reordering
                    // assertions such that as much information as possible can
                    // be extracted from its surrounding assertions.
                    const reorderingGetFirstCharAfter =
                        createReorderingGetFirstCharAfter(reported)
                    for (const assertion of allAssertions) {
                        if (!reported.has(assertion)) {
                            verifyAssertion(
                                assertion,
                                reorderingGetFirstCharAfter,
                            )
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
