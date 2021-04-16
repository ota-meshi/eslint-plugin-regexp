import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    fixReplaceNode,
    getRegexpLocation,
} from "../utils"

export default createRule("prefer-named-backreference", {
    meta: {
        docs: {
            description: "enforce using named backreferences",
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected: "Unexpected unnamed backreference.",
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
            return {
                onBackreferenceEnter(bNode) {
                    if (bNode.resolved.name && !bNode.raw.startsWith("\\k<")) {
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, bNode),
                            messageId: "unexpected",
                            fix: fixReplaceNode(
                                sourceCode,
                                node,
                                bNode,
                                () => `\\k<${bNode.resolved.name}>`,
                            ),
                        })
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
