import type {
    CharacterClass,
    CharacterClassElement,
    ExpressionCharacterClass,
    UnicodeSetsCharacterClass,
} from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { canUnwrapped, createRule, defineRegexpVisitor } from "../utils"
import { RESERVED_DOUBLE_PUNCTUATOR_CHARS } from "../utils/regex-syntax"

const ESCAPES_OUTSIDE_CHARACTER_CLASS = new Set("$()*+./?[{|")
const ESCAPES_OUTSIDE_CHARACTER_CLASS_WITH_U = new Set([
    ...ESCAPES_OUTSIDE_CHARACTER_CLASS,
    "}",
])

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
            unexpectedCharacterClassWith:
                "Unexpected character class with one {{type}}. Can remove brackets{{additional}}.",
            unexpectedUnnecessaryNestingCharacterClass:
                "Unexpected unnecessary nesting character class. Can remove brackets.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const ignores: string[] = context.options[0]?.ignores ?? ["="]

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
                    if (ccNode.negate) {
                        return
                    }
                    let messageId: string,
                        messageData: { type: string; additional?: string }
                    const unwrapped: string[] = ccNode.elements.map(
                        (_e, index) => {
                            const element = ccNode.elements[index]
                            return (
                                (index === 0
                                    ? getEscapedFirstRawIfNeeded(element)
                                    : null) ??
                                (index === ccNode.elements.length - 1
                                    ? getEscapedLastRawIfNeeded(element)
                                    : null) ??
                                element.raw
                            )
                        },
                    )
                    if (
                        ccNode.elements.length !== 1 &&
                        ccNode.parent.type === "CharacterClass"
                    ) {
                        messageId = "unexpectedUnnecessaryNestingCharacterClass"
                        messageData = {
                            type: "unnecessary nesting character class",
                        }
                        if (!ccNode.elements.length) {
                            // empty character class
                            const nextElement =
                                ccNode.parent.elements[
                                    ccNode.parent.elements.indexOf(
                                        ccNode as UnicodeSetsCharacterClass,
                                    ) + 1
                                ]
                            if (
                                nextElement &&
                                isNeedEscapedForFirstElement(nextElement)
                            ) {
                                unwrapped.push("\\") // Add a backslash to escape the next character.
                            }
                        }
                    } else {
                        if (ccNode.elements.length !== 1) {
                            return
                        }
                        const element = ccNode.elements[0]
                        if (
                            ignores.length > 0 &&
                            ignores.includes(element.raw)
                        ) {
                            return
                        }
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
                            unwrapped[0] =
                                getEscapedFirstRawIfNeeded(element.min) ??
                                getEscapedLastRawIfNeeded(element.min) ??
                                element.min.raw
                        } else if (element.type === "ClassStringDisjunction") {
                            if (!characterClassStack.length) {
                                // Only nesting character class
                                return
                            }
                            messageData = { type: "string literal" }
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
                        messageId = "unexpectedCharacterClassWith"
                    }

                    context.report({
                        node,
                        loc: getRegexpLocation(ccNode),
                        messageId,
                        data: {
                            type: messageData.type,
                            additional: messageData.additional || "",
                        },
                        fix: fixReplaceNode(ccNode, unwrapped.join("")),
                    })

                    /**
                     * Checks whether an escape is required if the given element is placed first
                     * after character class replacement.
                     */
                    function isNeedEscapedForFirstElement(
                        element: CharacterClassElement,
                    ) {
                        const char =
                            element.type === "Character"
                                ? element.raw
                                : element.type === "CharacterClassRange"
                                  ? element.min.raw
                                  : null
                        if (char == null) {
                            return false
                        }
                        if (characterClassStack.length) {
                            // Nesting character class

                            // Avoid [A&&[&]] => [A&&&]
                            if (
                                RESERVED_DOUBLE_PUNCTUATOR_CHARS.has(char) &&
                                // The previous character is the same
                                pattern[ccNode.start - 1] === char
                            ) {
                                return true
                            }

                            // Avoid [[]^] => [^]
                            return (
                                char === "^" &&
                                ccNode.parent.type === "CharacterClass" &&
                                ccNode.parent.elements[0] === ccNode
                            )
                        }

                        // Flat character class
                        return (
                            flags.unicode
                                ? ESCAPES_OUTSIDE_CHARACTER_CLASS_WITH_U
                                : ESCAPES_OUTSIDE_CHARACTER_CLASS
                        ).has(char)
                    }

                    /**
                     * Checks whether an escape is required if the given element is placed last
                     * after character class replacement.
                     */
                    function needEscapedForLastElement(
                        element: CharacterClassElement,
                    ) {
                        const char =
                            element.type === "Character"
                                ? element.raw
                                : element.type === "CharacterClassRange"
                                  ? element.max.raw
                                  : null
                        if (char == null) {
                            return false
                        }
                        if (characterClassStack.length) {
                            // Nesting character class

                            // Avoid [A[&]&B] => [A&&B]
                            return (
                                RESERVED_DOUBLE_PUNCTUATOR_CHARS.has(char) &&
                                // The next character is the same
                                pattern[ccNode.end] === char
                            )
                        }
                        return false
                    }

                    /**
                     * Returns the escaped raw text, if the given first element requires escaping.
                     * Otherwise, returns null.
                     */
                    function getEscapedFirstRawIfNeeded(
                        firstElement: CharacterClassElement,
                    ) {
                        if (isNeedEscapedForFirstElement(firstElement)) {
                            return `\\${firstElement.raw}`
                        }
                        return null
                    }

                    /**
                     * Returns the escaped raw text, if the given last element requires escaping.
                     * Otherwise, returns null.
                     */
                    function getEscapedLastRawIfNeeded(
                        lastElement: CharacterClassElement,
                    ) {
                        if (needEscapedForLastElement(lastElement)) {
                            const lastRaw =
                                lastElement.type === "Character"
                                    ? lastElement.raw
                                    : lastElement.type === "CharacterClassRange"
                                      ? lastElement.max.raw
                                      : "" // never
                            const prefix = lastElement.raw.slice(
                                0,
                                -lastRaw.length,
                            )
                            return `${prefix}\\${lastRaw}`
                        }
                        return null
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
