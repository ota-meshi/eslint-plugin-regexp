import type { LookaroundAssertion } from "regexpp/ast"
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
                    if (
                        aNode.kind === "lookahead" ||
                        aNode.kind === "lookbehind"
                    ) {
                        verify(regexpContext, aNode)
                    }
                },
            }
        }

        /** Verify for lookaround assertion */
        function verify(
            regexpContext: RegExpContext,
            assertion: LookaroundAssertion,
        ) {
            for (const alternative of assertion.alternatives) {
                const nested = at(
                    alternative.elements,
                    assertion.kind === "lookahead"
                        ? // The last lookahead positive assertion within
                          // a lookahead assertion is the same without the assertion.
                          -1
                        : // The first lookbehind positive assertion within
                          // a lookbehind assertion is the same without the assertion.
                          0,
                )
                if (
                    nested?.type === "Assertion" &&
                    nested.kind === assertion.kind &&
                    !nested.negate
                ) {
                    reportLookaroundAssertion(regexpContext, nested)
                }
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

// TODO After dropping support for Node < v16.6.0 we can use native `.at()`.
/**
 * `.at()` polyfill
 * see https://github.com/tc39/proposal-relative-indexing-method#polyfill
 */
function at<T>(array: T[], n: number) {
    // ToInteger() abstract op
    let num = Math.trunc(n) || 0
    // Allow negative indexing from the end
    if (num < 0) num += array.length
    // OOB access is guaranteed to return undefined
    if (num < 0 || num >= array.length) return undefined
    // Otherwise, this is just normal property access
    return array[num]
}
