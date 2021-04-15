import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { CapturingGroup, Group, Pattern } from "regexpp/ast"
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"

export default createRule("no-empty-alternative", {
    meta: {
        docs: {
            description: "disallow alternatives without elements",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
            default: "warn",
        },
        schema: [],
        messages: {
            empty: "No empty alternatives. Use quantifiers instead.",
        },
        type: "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            /**
             * Verify alternatives
             */
            function verifyAlternatives(
                regexpNode: CapturingGroup | Group | Pattern,
            ) {
                if (regexpNode.alternatives.length >= 2) {
                    // We want to have at least two alternatives because the zero alternatives isn't possible because of
                    // the parser and one alternative is already handled by other rules.
                    for (let i = 0; i < regexpNode.alternatives.length; i++) {
                        const alt = regexpNode.alternatives[i]
                        if (alt.elements.length === 0) {
                            context.report({
                                node,
                                loc: getRegexpLocation(sourceCode, node, alt),
                                messageId: "empty",
                            })
                            // don't report the same node multiple times
                            return
                        }
                    }
                }
            }

            return {
                onGroupEnter: verifyAlternatives,
                onCapturingGroupEnter: verifyAlternatives,
                onPatternEnter: verifyAlternatives,
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
