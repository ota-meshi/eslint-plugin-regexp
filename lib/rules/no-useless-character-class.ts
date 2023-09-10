import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { canUnwrapped, createRule, defineRegexpVisitor } from "../utils"
import type {
    CharacterClass,
    CharacterClassElement,
    ExpressionCharacterClass,
} from "@eslint-community/regexpp/ast"

const ESCAPES_OUTSIDE_CHARACTER_CLASS = new Set("$()*+./?[{|")
const ESCAPES_OUTSIDE_CHARACTER_CLASS_WITH_U = new Set([
    ...ESCAPES_OUTSIDE_CHARACTER_CLASS,
    "}",
])
// A single character set of ClassSetReservedDoublePunctuator.
// && !! ## $$ %% ** ++ ,, .. :: ;; << == >> ?? @@ ^^ `` ~~ are ClassSetReservedDoublePunctuator
const REGEX_CLASS_SET_RESERVED_DOUBLE_PUNCTUATOR = new Set(
    "!#$%&*+,.:;<=>?@^`~",
)

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
                                    ? getEscapedLatsRawIfNeeded(element)
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
                                getEscapedLatsRawIfNeeded(element.min) ??
                                element.min.raw
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
                     * Returns the escaped raw text, if the given first element requires escaping.
                     * Otherwise, returns null.
                     */
                    function getEscapedFirstRawIfNeeded(
                        firstElement: CharacterClassElement,
                    ) {
                        const firstRaw =
                            firstElement.type === "Character"
                                ? firstElement.raw
                                : firstElement.type === "CharacterClassRange"
                                ? firstElement.min.raw
                                : null
                        if (firstRaw == null) {
                            return null
                        }
                        if (characterClassStack.length) {
                            // Nesting character class

                            // Avoid [A&&[&]] => [A&&&]
                            if (
                                REGEX_CLASS_SET_RESERVED_DOUBLE_PUNCTUATOR.has(
                                    firstRaw,
                                ) &&
                                // The previous character is the same
                                pattern[ccNode.start - 1] === firstRaw
                            ) {
                                return `\\${firstElement.raw}`
                            }
                            return null
                        }

                        // Flat character class
                        if (
                            (flags.unicode
                                ? ESCAPES_OUTSIDE_CHARACTER_CLASS_WITH_U
                                : ESCAPES_OUTSIDE_CHARACTER_CLASS
                            ).has(firstRaw)
                        ) {
                            return `\\${firstElement.raw}`
                        }
                        return null
                    }

                    /**
                     * Returns the escaped raw text, if the given last element requires escaping.
                     * Otherwise, returns null.
                     */
                    function getEscapedLatsRawIfNeeded(
                        lastElement: CharacterClassElement,
                    ) {
                        const lastRaw =
                            lastElement.type === "Character"
                                ? lastElement.raw
                                : lastElement.type === "CharacterClassRange"
                                ? lastElement.max.raw
                                : null
                        if (lastRaw == null) {
                            return null
                        }
                        if (characterClassStack.length) {
                            // Nesting character class

                            // Avoid [A[&]&B] => [A&&B]
                            if (
                                REGEX_CLASS_SET_RESERVED_DOUBLE_PUNCTUATOR.has(
                                    lastRaw,
                                ) &&
                                // The next character is the same
                                pattern[ccNode.end] === lastRaw
                            ) {
                                const prefix = lastElement.raw.slice(
                                    0,
                                    -lastRaw.length,
                                )
                                return `${prefix}\\${lastRaw}`
                            }
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
