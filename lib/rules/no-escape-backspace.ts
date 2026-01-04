import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils/index.ts"
import {
    CP_BACKSPACE,
    createRule,
    defineRegexpVisitor,
} from "../utils/index.ts"

export default createRule("no-escape-backspace", {
    meta: {
        docs: {
            description: "disallow escape backspace (`[\\b]`)",
            category: "Possible Errors",
            recommended: true,
        },
        schema: [],
        hasSuggestions: true,
        messages: {
            unexpected: "Unexpected '[\\b]'. Use '\\u0008' instead.",
            suggest: "Use '\\u0008'.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        function createVisitor({
            node,
            getRegexpLocation,
            fixReplaceNode,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onCharacterEnter(cNode) {
                    if (cNode.value === CP_BACKSPACE && cNode.raw === "\\b") {
                        context.report({
                            node,
                            loc: getRegexpLocation(cNode),
                            messageId: "unexpected",
                            suggest: [
                                {
                                    messageId: "suggest",
                                    fix: fixReplaceNode(cNode, "\\u0008"),
                                },
                            ],
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
