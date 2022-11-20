import type {
    LookaheadAssertion,
    LookaroundAssertion,
    LookbehindAssertion,
} from "regexpp/ast"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("no-useless-lookaround-assertions", {
    meta: {
        docs: {
            description: "disallow useless nested lookaround assertions",
            category: "Best Practices",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: "This {{kind}} assertion is useless.",
        },
        type: "suggestion",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            return {
                onAssertionEnter(aNode) {
                    if (aNode.kind === "lookahead") {
                        verifyForLookahead(regexpContext, aNode)
                    } else if (aNode.kind === "lookbehind") {
                        verifyForLookbehind(regexpContext, aNode)
                    }
                },
            }
        }

        /** Verify for lookahead assertion */
        function verifyForLookahead(
            regexpContext: RegExpContext,
            assertion: LookaheadAssertion,
        ) {
            for (const alternative of assertion.alternatives) {
                const last =
                    alternative.elements[alternative.elements.length - 1]
                if (
                    last?.type !== "Assertion" ||
                    last.kind !== "lookahead" ||
                    last.negate
                ) {
                    continue
                }
                // The last lookahead positive assertion within
                // a lookahead assertion is the same without the assertion.
                reportLookaroundAssertion(regexpContext, last)
            }
        }

        /** Verify for lookbehind assertion */
        function verifyForLookbehind(
            regexpContext: RegExpContext,
            assertion: LookbehindAssertion,
        ) {
            for (const alternative of assertion.alternatives) {
                const first = alternative.elements[0]
                if (
                    first?.type !== "Assertion" ||
                    first.kind !== "lookbehind" ||
                    first.negate
                ) {
                    continue
                }
                // The first lookbehind positive assertion within
                // a lookbehind assertion is the same without the assertion.
                reportLookaroundAssertion(regexpContext, first)
            }
        }

        /** Report */
        function reportLookaroundAssertion(
            { node, getRegexpLocation, fixReplaceNode }: RegExpContext,
            assertion: LookaroundAssertion,
        ) {
            context.report({
                node,
                loc: getRegexpLocation(assertion),
                messageId: "unexpected",
                data: {
                    kind: assertion.kind,
                },
                fix: fixReplaceNode(assertion, () => {
                    const alternatives = assertion.alternatives.map(
                        (alt) => alt.raw,
                    )
                    if (alternatives.length === 1) {
                        // unwrap `(?=` and `)`
                        return alternatives[0]
                    }
                    // replace `?=` with `?:`
                    return `(?:${alternatives.join("|")})`
                }),
            })
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
