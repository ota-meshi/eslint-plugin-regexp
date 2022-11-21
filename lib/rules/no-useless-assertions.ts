import type { RegExpVisitor } from "regexpp/visitor"
import type {
    Assertion,
    EdgeAssertion,
    Element,
    LookaroundAssertion,
    WordBoundaryAssertion,
} from "regexpp/ast"
import { visitRegExpAST } from "regexpp"
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
} from "regexp-ast-analysis"
import { mention } from "../utils/mention"

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
                if (!isZeroLength(other)) {
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
}

export default createRule("no-useless-assertions", {
    meta: {
        docs: {
            description:
                "disallow assertions that are known to always accept (or reject)",
            category: "Possible Errors",
            recommended: true,
        },
        schema: [],
        messages,
        type: "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor({
            node,
            flags,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
            const reported = new Set<Assertion>()

            /** Report */
            function report(
                assertion: Assertion,
                messageId: keyof typeof messages,
                data: Record<string, string>,
            ) {
                reported.add(assertion)

                context.report({
                    node,
                    loc: getRegexpLocation(assertion),
                    messageId,
                    data: {
                        assertion: mention(assertion),
                        ...data,
                    },
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
                        })
                    } else {
                        // only if the character is a sub set of /./, will the assertion trivially reject

                        if (next.char.isDisjointWith(lineTerminator)) {
                            report(
                                assertion,
                                "alwaysRejectByNonLineTerminator",
                                { followedOrPreceded },
                            )
                        } else if (next.char.isSubsetOf(lineTerminator)) {
                            report(assertion, "alwaysAcceptByLineTerminator", {
                                followedOrPreceded,
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
                if (isPotentiallyEmpty(assertion.alternatives)) {
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

                if (after.edge) {
                    return
                }

                // accept is harder because that can't generally be decided by the first character

                // if this contains another assertion then that might reject. It's out of our control
                if (
                    !hasSomeDescendant(
                        assertion,
                        (d) => d !== assertion && d.type === "Assertion",
                    )
                ) {
                    const range = getLengthRange(assertion.alternatives)
                    // we only check the first character, so it's only correct if the assertion requires only one
                    // character
                    if (range.max === 1) {
                        // require exactness
                        if (
                            firstOf.exact &&
                            after.char.isSubsetOf(firstOf.char)
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
                }
            }

            return {
                onPatternEnter(pattern) {
                    // Phase 1:
                    // The context of assertions is determined by only looking
                    // at elements after the current assertion. This means that
                    // the order of assertions is kept as is.
                    visitRegExpAST(pattern, {
                        onAssertionEnter(assertion) {
                            verifyAssertion(assertion, getFirstCharAfter)
                        },
                    })

                    // Phase 2:
                    // The context of assertions is determined by reordering
                    // assertions such that as much information as possible can
                    // be extracted from its surrounding assertions.
                    const reorderingGetFirstCharAfter =
                        createReorderingGetFirstCharAfter(reported)
                    visitRegExpAST(pattern, {
                        onAssertionEnter(assertion) {
                            if (reported.has(assertion)) {
                                return
                            }
                            verifyAssertion(
                                assertion,
                                reorderingGetFirstCharAfter,
                            )
                        },
                    })
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
