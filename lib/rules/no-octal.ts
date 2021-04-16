import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    fixReplaceNode,
    getRegexpLocation,
    isOctalEscape,
} from "../utils"

export default createRule("no-octal", {
    meta: {
        docs: {
            description: "disallow octal escape sequence",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected octal escape sequence '{{expr}}'.",
            replaceHex:
                "Replace the octal escape sequence with a hexadecimal escape sequence.",
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
                onCharacterEnter(cNode) {
                    if (cNode.raw === "\\0") {
                        // \0 looks like a octal escape but is allowed
                        return
                    }
                    if (!isOctalEscape(cNode.raw)) {
                        // not an octal escape
                        return
                    }

                    const report =
                        // always report octal escapes that look like \0
                        cNode.raw.startsWith("\\0") ||
                        // don't report octal escapes inside character classes
                        // (e.g. [\4-\6]).
                        !(
                            cNode.parent.type === "CharacterClass" ||
                            cNode.parent.type === "CharacterClassRange"
                        )

                    if (report) {
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, cNode),
                            messageId: "unexpected",
                            data: {
                                expr: cNode.raw,
                            },
                            suggest: [
                                {
                                    messageId: "replaceHex",
                                    fix: fixReplaceNode(
                                        sourceCode,
                                        node,
                                        cNode,
                                        () => {
                                            return `\\x${cNode.value
                                                .toString(16)
                                                .padStart(2, "0")}`
                                        },
                                    ),
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
