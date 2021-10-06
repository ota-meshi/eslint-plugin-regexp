import type { RegExpVisitor } from "regexpp/visitor"
import type {
    CharacterClass,
    CharacterSet,
    LookaroundAssertion,
} from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import {
    Chars,
    getFirstCharAfter,
    getMatchingDirectionFromAssertionKind,
    invertMatchingDirection,
    toCharSet,
} from "regexp-ast-analysis"

/**
 * If the lookaround only consists of a single character, character set, or
 * character class, then this single character will be returned.
 */
function getCharacters(
    lookaround: LookaroundAssertion,
): CharacterSet | CharacterClass | null {
    if (lookaround.alternatives.length === 1) {
        const alt = lookaround.alternatives[0]
        if (alt.elements.length === 1) {
            const first = alt.elements[0]
            if (
                first.type === "CharacterSet" ||
                first.type === "CharacterClass"
            ) {
                return first
            }
        }
    }
    return null
}

export default createRule("prefer-predefined-assertion", {
    meta: {
        docs: {
            description:
                "prefer predefined assertion over equivalent lookarounds",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            replace:
                "This lookaround assertion can be replaced with {{kind}} ('{{expr}}').",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, flags, getRegexpLocation, fixReplaceNode } =
                regexpContext

            const word = Chars.word(flags)
            const nonWord = Chars.word(flags).negate()

            // /\b/ == /(?<!\w)(?=\w)|(?<=\w)(?!\w)/
            // /\B/ == /(?<=\w)(?=\w)|(?<!\w)(?!\w)/

            /**
             * Tries to replace the given assertion with a word boundary
             * assertion
             */
            function replaceWordAssertion(
                aNode: LookaroundAssertion,
                wordNegated: boolean,
            ): void {
                const direction = getMatchingDirectionFromAssertionKind(
                    aNode.kind,
                )

                /**
                 * Whether the lookaround is equivalent to (?!\w) / (?<!\w) or (?=\w) / (?<=\w)
                 */
                let lookaroundNegated = aNode.negate
                if (wordNegated) {
                    // if the lookaround only contains a \W, then we have to negate the lookaround, so it only
                    // contains a \w. This is only possible iff we know that the pattern requires at least one
                    // character after the lookaround (in the direction of the lookaround).
                    //
                    // Examples:
                    // (?=\W) == (?!\w|$)   ; Here we need to eliminate the $ which can be done by proving that the
                    //                        pattern matches another character after the lookahead. Example:
                    // (?=\W).+ == (?!\w).+ ; Since we know that the lookahead is always followed by a dot, we
                    //                        eliminate the $ alternative because it will always reject.
                    // (?!\W).+ == (?=\w|$).+ == (?=\w).+

                    const after = getFirstCharAfter(aNode, direction, flags)

                    const hasNextCharacter = !after.edge
                    if (hasNextCharacter) {
                        // we can successfully negate the lookaround
                        lookaroundNegated = !lookaroundNegated
                    } else {
                        // we couldn't negate the \W, so it's not possible to convert the lookaround into a
                        // predefined assertion
                        return
                    }
                }

                const before = getFirstCharAfter(
                    aNode,
                    invertMatchingDirection(direction),
                    flags,
                )
                if (before.edge) {
                    // to do the branch elimination necessary, we need to know the previous/next character
                    return
                }

                let otherNegated
                if (before.char.isSubsetOf(word)) {
                    // we can think of the previous/next character as \w
                    otherNegated = false
                } else if (before.char.isSubsetOf(nonWord)) {
                    // we can think of the previous/next character as \W
                    otherNegated = true
                } else {
                    // the previous/next character is a subset of neither \w nor \W, so we can't do anything here
                    return
                }

                let kind = undefined
                let replacement = undefined
                if (lookaroundNegated === otherNegated) {
                    // \B
                    kind = "a negated word boundary assertion"
                    replacement = "\\B"
                } else {
                    // \b
                    kind = "a word boundary assertion"
                    replacement = "\\b"
                }

                if (kind && replacement) {
                    context.report({
                        node,
                        loc: getRegexpLocation(aNode),
                        messageId: "replace",
                        data: { kind, expr: replacement },
                        fix: fixReplaceNode(aNode, replacement),
                    })
                }
            }

            /**
             * Tries to replace the given assertion with a edge assertion
             */
            function replaceEdgeAssertion(
                aNode: LookaroundAssertion,
                lineAssertion: boolean,
            ): void {
                if (!aNode.negate) {
                    return
                }
                if (flags.multiline === lineAssertion) {
                    const replacement = aNode.kind === "lookahead" ? "$" : "^"

                    context.report({
                        node,
                        loc: getRegexpLocation(aNode),
                        messageId: "replace",
                        data: { kind: "an edge assertion", expr: replacement },
                        fix: fixReplaceNode(aNode, replacement),
                    })
                }
            }

            return {
                onAssertionEnter(aNode) {
                    if (
                        aNode.kind !== "lookahead" &&
                        aNode.kind !== "lookbehind"
                    ) {
                        // this rule doesn't affect predefined assertions
                        return
                    }

                    const chars = getCharacters(aNode)
                    if (chars === null) {
                        return
                    }

                    if (chars.type === "CharacterSet") {
                        if (chars.kind === "word") {
                            replaceWordAssertion(aNode, chars.negate)
                            return
                        }
                        if (chars.kind === "any") {
                            replaceEdgeAssertion(aNode, !flags.dotAll)
                            return
                        }
                    }

                    const charSet = toCharSet(chars, flags)
                    if (charSet.isAll) {
                        replaceEdgeAssertion(aNode, false)
                    } else if (charSet.equals(word)) {
                        replaceWordAssertion(aNode, false)
                    } else if (charSet.equals(nonWord)) {
                        replaceWordAssertion(aNode, true)
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
