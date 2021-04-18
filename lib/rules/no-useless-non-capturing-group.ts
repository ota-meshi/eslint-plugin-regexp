import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { canUnwrapped, createRule, defineRegexpVisitor } from "../utils"

export default createRule("no-useless-non-capturing-group", {
    meta: {
        docs: {
            description: "disallow unnecessary Non-capturing group",
            // TODO In the major version
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: "Unexpected quantifier Non-capturing group.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor({
            node,
            getRegexpLocation,
            getRegexpRange,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onGroupEnter(gNode) {
                    if (gNode.alternatives.length !== 1) {
                        // Useful when using disjunctions.
                        // e.g. /(?:a|b)/
                        return
                    }
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

                    context.report({
                        node,
                        loc: getRegexpLocation(gNode),
                        messageId: "unexpected",
                        fix(fixer) {
                            const groupRange = getRegexpRange(gNode)
                            const altRange = getRegexpRange(alt)
                            if (!groupRange || !altRange) {
                                return null
                            }
                            return [
                                fixer.removeRange([groupRange[0], altRange[0]]),
                                fixer.removeRange([altRange[1], groupRange[1]]),
                            ]
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
