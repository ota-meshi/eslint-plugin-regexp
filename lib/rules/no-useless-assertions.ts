import type { RegExpVisitor } from "regexpp/visitor"
import type {
    Assertion,
    EdgeAssertion,
    LookaroundAssertion,
    WordBoundaryAssertion,
} from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import {
    Chars,
    getFirstCharAfter,
    getFirstConsumedChar,
    getLengthRange,
    getMatchingDirectionFromAssertionKind,
    hasSomeDescendant,
    isPotentiallyEmpty,
} from "regexp-ast-analysis"
import { mention } from "../utils/mention"

const messages = {
    alwaysRejectByChar:
        "{{assertion}} will always reject because it is {{followedOrPreceded}} by a character.",
    alwaysRejectByNonLineTerminator:
        "{{assertion}} will always reject because it is {{followedOrPreceded}} by a non-line-terminator character.",
    alwaysAcceptByLineTerminator:
        "{{assertion}} will always accept because it is {{followedOrPreceded}} by a line-terminator character.",
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
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
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
            /** Report */
            function report(
                assertion: Assertion,
                messageId: keyof typeof messages,
                data: Record<string, string>,
            ) {
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
            function verifyStartOrEnd(assertion: EdgeAssertion): void {
                // Note: /^/ is the same as /(?<!.)/s and /^/m is the same as /(?<!.)/
                // Note: /$/ is the same as /(?!.)/s and /$/m is the same as /(?!.)/

                // get the "next" character
                const direction = getMatchingDirectionFromAssertionKind(
                    assertion.kind,
                )
                const next = getFirstCharAfter(assertion, direction, flags)

                const followedOrPreceded =
                    assertion.kind === "end" ? "followed" : "preceded"

                if (!next.edge) {
                    // there is always some character of `node`

                    if (!flags.multiline) {
                        // since the m flag isn't present any character will result in trivial rejection
                        report(assertion, "alwaysRejectByChar", {
                            followedOrPreceded,
                        })
                    } else {
                        // only if the character is a sub set of /./, will the assertion trivially reject

                        const lineTerminator = Chars.lineTerminator(flags)

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
            ): void {
                const word = Chars.word(flags)

                const next = getFirstCharAfter(assertion, "ltr", flags)
                const prev = getFirstCharAfter(assertion, "rtl", flags)

                if (prev.edge || next.edge) {
                    // we can only do this analysis if we know the previous and next character
                    return
                }

                const nextIsWord = next.char.isSubsetOf(word)
                const prevIsWord = prev.char.isSubsetOf(word)
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
            function verifyLookaround(assertion: LookaroundAssertion): void {
                if (isPotentiallyEmpty(assertion.alternatives)) {
                    // we don't handle trivial accept/reject based on emptiness
                    return
                }

                const direction = getMatchingDirectionFromAssertionKind(
                    assertion.kind,
                )
                const after = getFirstCharAfter(assertion, direction, flags)
                if (after.edge) {
                    return
                }

                const firstOf = getFirstConsumedChar(
                    assertion.alternatives,
                    direction,
                    flags,
                )
                if (firstOf.empty) {
                    return
                }

                // the idea here is that a negate lookaround accepts when non-negated version reject and vise versa.
                const accept = assertion.negate ? "reject" : "accept"
                const reject = assertion.negate ? "accept" : "reject"

                // Careful now! If exact is false, we are only guaranteed to have a superset of the actual character.
                // False negatives are fine but we can't have false positives.

                if (after.char.isDisjointWith(firstOf.char)) {
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
                    if (range && range.max === 1) {
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

            return {
                onAssertionEnter(assertion) {
                    switch (assertion.kind) {
                        case "start":
                        case "end":
                            verifyStartOrEnd(assertion)
                            break

                        case "word":
                            verifyWordBoundary(assertion)
                            break

                        case "lookahead":
                        case "lookbehind":
                            verifyLookaround(assertion)
                            break
                        default:
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
