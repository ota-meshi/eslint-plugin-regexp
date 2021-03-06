import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { CapturingGroup, Group, Pattern } from "regexpp/ast"
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"
import { isEqualNodes } from "../utils/regexp-ast"

export default createRule("no-dupe-disjunctions", {
    meta: {
        docs: {
            description: "disallow duplicate disjunctions",
            // TODO In the major version
            // recommended: true,
            recommended: false,
        },
        schema: [],
        messages: {
            duplicated: "The disjunctions are duplicated.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            /** Verify group node */
            function verify(regexpNode: Group | CapturingGroup | Pattern) {
                const otherAlts = []
                for (const alt of regexpNode.alternatives) {
                    const dupeAlt = otherAlts.find((o) =>
                        isEqualNodes(alt, o, (a, _b) => {
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
                            messageId: "duplicated",
                        })
                    } else {
                        otherAlts.push(alt)
                    }
                }
            }

            return {
                onPatternEnter: verify,
                onGroupEnter: verify,
                onCapturingGroupEnter: verify,
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
