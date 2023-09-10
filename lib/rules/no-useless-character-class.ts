import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { canUnwrapped, createRule, defineRegexpVisitor } from "../utils"
import type {
    CharacterClass,
    ExpressionCharacterClass,
} from "@eslint-community/regexpp/ast"

export default createRule("no-useless-character-class", {
    meta: {
        docs: {
            description: "disallow character class with one character",
            category: "Best Practices",
            recommended: true,
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
            pattern,
            flags,
            fixReplaceNode,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
            const characterClassStack: (
                | CharacterClass
                | ExpressionCharacterClass
            )[] = []
            return {
                onExpressionCharacterClassEnter(eccNode) {
                    characterClassStack.push(eccNode)
                },
                onExpressionCharacterClassLeave() {
                    characterClassStack.pop()
                },
                onCharacterClassEnter(ccNode) {
                    characterClassStack.push(ccNode)
                },
                onCharacterClassLeave(ccNode) {
                    characterClassStack.pop()
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
                    let messageData: { type: string; additional?: string }
                    if (element.type === "Character") {
                        if (element.raw === "\\b") {
                            // Backspace escape
                            return
                        }
                        if (
                            /^\\\d+$/u.test(element.raw) &&
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
                        messageData = { type: "character" }
                    } else if (element.type === "CharacterClassRange") {
                        if (element.min.value !== element.max.value) {
                            return
                        }
                        messageData = {
                            type: "character class range",
                            additional: " and range",
                        }
                    } else if (element.type === "ClassStringDisjunction") {
                        if (!characterClassStack.length) {
                            // Only nesting character class
                            return
                        }
                        messageData = { type: "string alternative" }
                    } else if (element.type === "CharacterSet") {
                        messageData = { type: "character class escape" }
                    } else if (
                        element.type === "CharacterClass" ||
                        element.type === "ExpressionCharacterClass"
                    ) {
                        messageData = { type: "character class" }
                    } else {
                        return
                    }

                    context.report({
                        node,
                        loc: getRegexpLocation(ccNode),
                        messageId: "unexpected",
                        data: {
                            type: messageData.type,
                            additional: messageData.additional || "",
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
                                let needsEscape = false
                                if (characterClassStack.length) {
                                    // Nesting character class

                                    // A single character of ClassSetReservedDoublePunctuator.
                                    // && !! ## $$ %% ** ++ ,, .. :: ;; << == >> ?? @@ ^^ `` ~~ are ClassSetReservedDoublePunctuator
                                    if (/^[!#$%&*+,.:;<=>?@^`~]$/u.test(text)) {
                                        // Avoid [A[&]&B] => [A&&B], [A&&[&]] => [A&&&]
                                        needsEscape =
                                            // The previous character is the same
                                            pattern[ccNode.end] === text ||
                                            // The next character is the same
                                            pattern[ccNode.start - 1] === text
                                    }
                                } else {
                                    // Flat character class
                                    needsEscape =
                                        /^[$()*+./?[{|]$/u.test(text) ||
                                        (flags.unicode && text === "}")
                                }
                                if (needsEscape) {
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
