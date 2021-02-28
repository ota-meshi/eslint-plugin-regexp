import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    getRegexpRange,
} from "../utils"

export default createRule("no-useless-character-class", {
    meta: {
        docs: {
            description: "disallow character class with one character",
            // TODO In the major version
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    ignores: {
                        type: "array",
                        items: {
                            type: "string",
                            minLength: 1,
                        },
                        uniqueItems: true,
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpected:
                "Unexpected character class with one {{type}}. Can remove brackets.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()
        const ignores: string[] = context.options[0]?.ignores ?? ["="]

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            return {
                onCharacterClassEnter(ccNode) {
                    if (ccNode.elements.length !== 1) {
                        return
                    }
                    if (ccNode.negate) {
                        return
                    }
                    const element = ccNode.elements[0]
                    if (element.type === "Character") {
                        if (
                            ignores.length > 0 &&
                            ignores.includes(
                                String.fromCodePoint(element.value),
                            )
                        ) {
                            return
                        }
                    } else if (element.type === "CharacterSet") {
                        if (
                            ignores.length > 0 &&
                            ignores.includes(element.raw)
                        ) {
                            return
                        }
                    } else {
                        return
                    }

                    context.report({
                        node,
                        loc: getRegexpLocation(sourceCode, node, ccNode),
                        messageId: "unexpected",
                        data: {
                            type:
                                element.type === "Character"
                                    ? "character"
                                    : "character set",
                        },
                        fix(fixer) {
                            const range = getRegexpRange(
                                sourceCode,
                                node,
                                ccNode,
                            )
                            if (range == null) {
                                return null
                            }
                            return [
                                fixer.removeRange([range[0], range[0] + 1]),
                                fixer.removeRange([range[1] - 1, range[1]]),
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
