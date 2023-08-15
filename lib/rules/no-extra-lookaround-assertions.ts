import type { LookaroundAssertion } from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("no-extra-lookaround-assertions", {
    meta: {
        docs: {
            description: "disallow unnecessary nested lookaround assertions",
            category: "Best Practices",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            canBeInlined:
                "This {{kind}} assertion is useless and can be inlined.",
            canBeConvertedIntoGroup:
                "This {{kind}} assertion is useless and can be converted into a group.",
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
                const nested = alternative.elements.at(
                    assertion.kind === "lookahead"
                        ? // The last positive lookahead assertion within
                          // a lookahead assertion is the same without the assertion.
                          -1
                        : // The first positive lookbehind assertion within
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
            let messageId, replaceText
            if (assertion.alternatives.length === 1) {
                messageId = "canBeInlined"
                // unwrap `(?=` and `)`, `(?<=` and `)`
                replaceText = assertion.alternatives[0].raw
            } else {
                messageId = "canBeConvertedIntoGroup"
                // replace `?=` with `?:`, or `?<=` with `?:`
                replaceText = `(?:${assertion.alternatives
                    .map((alt) => alt.raw)
                    .join("|")})`
            }

            context.report({
                node,
                loc: getRegexpLocation(assertion),
                messageId,
                data: {
                    kind: assertion.kind,
                },
                fix: fixReplaceNode(assertion, replaceText),
            })
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
