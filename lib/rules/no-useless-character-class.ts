import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { canUnwrapped, createRule, defineRegexpVisitor } from "../utils"

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
                "Unexpected character class with one {{type}}. Can remove brackets{{additional}}.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const ignores: string[] = context.options[0]?.ignores ?? ["="]

        /**
         * Create visitor
         */
        function createVisitor({
            node,
            flags,
            fixReplaceNode,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                // eslint-disable-next-line complexity -- X(
                onCharacterClassEnter(ccNode) {
                    if (ccNode.elements.length !== 1) {
                        return
                    }
                    if (ccNode.negate) {
                        return
                    }
                    const element = ccNode.elements[0]
                    if (ignores.length > 0 && ignores.includes(element.raw)) {
                        return
                    }
                    if (element.type === "Character") {
                        if (element.raw === "\\b") {
                            // Backspace escape
                            return
                        }
                        if (
                            /^\\\d+$/.test(element.raw) &&
                            !element.raw.startsWith("\\0")
                        ) {
                            // Avoid back reference
                            return
                        }
                        if (
                            ignores.length > 0 &&
                            ignores.includes(
                                String.fromCodePoint(element.value),
                            )
                        ) {
                            return
                        }
                        if (!canUnwrapped(ccNode, element.raw)) {
                            return
                        }
                    } else if (element.type === "CharacterClassRange") {
                        if (element.min.value !== element.max.value) {
                            return
                        }
                    } else if (element.type !== "CharacterSet") {
                        return
                    }

                    context.report({
                        node,
                        loc: getRegexpLocation(ccNode),
                        messageId: "unexpected",
                        data: {
                            type:
                                element.type === "Character"
                                    ? "character"
                                    : element.type === "CharacterClassRange"
                                    ? "character class range"
                                    : "character class escape",
                            additional:
                                element.type === "CharacterClassRange"
                                    ? " and range"
                                    : "",
                        },
                        fix: fixReplaceNode(ccNode, () => {
                            let text: string =
                                element.type === "CharacterClassRange"
                                    ? element.min.raw
                                    : element.raw
                            if (
                                element.type === "Character" ||
                                element.type === "CharacterClassRange"
                            ) {
                                if (
                                    /^[$(-+./?[{|]$/u.test(text) ||
                                    (flags.unicode && text === "}")
                                ) {
                                    text = `\\${text}`
                                }
                            }
                            return text
                        }),
                    })
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
