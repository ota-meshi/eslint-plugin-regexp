import type { Group } from "regexpp/ast"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { canUnwrapped, createRule, defineRegexpVisitor } from "../utils"

/**
 * Returns whether the given group is the top-level group of its pattern.
 *
 * A pattern with a top-level groups is of the form `/(?:...)/flags`.
 */
function isTopLevel(group: Group): boolean {
    const parent = group.parent
    if (parent.type === "Alternative" && parent.elements.length === 1) {
        const parentParent = parent.parent
        if (
            parentParent.type === "Pattern" &&
            parentParent.alternatives.length === 1
        ) {
            return true
        }
    }
    return false
}

export default createRule("no-useless-non-capturing-group", {
    meta: {
        docs: {
            description: "disallow unnecessary Non-capturing group",
            category: "Stylistic Issues",
            // TODO In the major version
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    allowTop: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpected: "Unexpected quantifier Non-capturing group.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const allowTop = context.options[0]?.allowTop ?? false

        /**
         * Create visitor
         */
        function createVisitor({
            node,
            getRegexpLocation,
            fixReplaceNode,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onGroupEnter(gNode) {
                    if (allowTop && isTopLevel(gNode)) {
                        return
                    }

                    if (gNode.alternatives.length === 1) {
                        const alt = gNode.alternatives[0]
                        if (alt.elements.length === 0) {
                            // Ignore empty groups. You can check with another rule.
                            // e.g. /(?:)/
                            return
                        }
                        const parent = gNode.parent
                        if (
                            parent.type === "Quantifier" &&
                            (alt.elements.length > 1 ||
                                alt.elements[0].type === "Quantifier")
                        ) {
                            // e.g. /(?:ab)?/
                            return
                        }
                        if (!canUnwrapped(gNode, alt.raw)) {
                            return
                        }
                    } else {
                        // the group might still be useless
                        // e.g. /a(?:b|(?:c|d)|e)/
                        const parent = gNode.parent
                        if (parent.type !== "Alternative") {
                            return
                        }
                        if (parent.elements.length !== 1) {
                            return
                        }
                    }

                    context.report({
                        node,
                        loc: getRegexpLocation(gNode),
                        messageId: "unexpected",
                        fix: fixReplaceNode(gNode, gNode.raw.slice(3, -1)),
                    })
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
