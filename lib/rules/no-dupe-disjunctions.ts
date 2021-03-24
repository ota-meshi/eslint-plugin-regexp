import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type {
    CapturingGroup,
    Group,
    LookaroundAssertion,
    Pattern,
} from "regexpp/ast"
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"
import { isCoveredNode, isEqualNodes } from "../utils/regexp-ast"

export default createRule("no-dupe-disjunctions", {
    meta: {
        docs: {
            description: "disallow duplicate disjunctions",
            // TODO In the major version
            // recommended: true,
            recommended: false,
        },
        schema: [
            {
                type: "object",
                properties: {
                    disallowNeverMatch: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            duplicated: "The disjunctions are duplicated.",
            neverExecute:
                "This disjunction can never match. Its condition is covered by previous conditions in the disjunctions.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const disallowNeverMatch = Boolean(
            context.options[0]?.disallowNeverMatch,
        )
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            /** Verify group node */
            function verify(
                regexpNode:
                    | Group
                    | CapturingGroup
                    | Pattern
                    | LookaroundAssertion,
            ) {
                const leftAlts = []
                for (const alt of regexpNode.alternatives) {
                    const dupeAlt = disallowNeverMatch
                        ? leftAlts.find((leftAlt) =>
                              isCoveredNode(leftAlt, alt),
                          )
                        : leftAlts.find((leftAlt) =>
                              isEqualNodes(leftAlt, alt, (a, _b) => {
                                  if (a.type === "CapturingGroup") {
                                      return false
                                  }
                                  return null
                              }),
                          )
                    if (dupeAlt) {
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, alt),
                            messageId:
                                disallowNeverMatch &&
                                !isEqualNodes(dupeAlt, alt)
                                    ? "neverExecute"
                                    : "duplicated",
                        })
                        continue
                    }

                    leftAlts.push(alt)
                }
            }

            return {
                onPatternEnter: verify,
                onGroupEnter: verify,
                onCapturingGroupEnter: verify,
                onAssertionEnter(aNode) {
                    if (
                        aNode.kind === "lookahead" ||
                        aNode.kind === "lookbehind"
                    ) {
                        verify(aNode)
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
