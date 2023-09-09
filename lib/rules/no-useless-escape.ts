import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    Character,
    CharacterClass,
    ExpressionCharacterClass,
} from "@eslint-community/regexpp/ast"
import type { RegExpContext } from "../utils"
import {
    createRule,
    defineRegexpVisitor,
    CP_BACK_SLASH,
    CP_STAR,
    CP_CLOSING_BRACKET,
    CP_SLASH,
    CP_CARET,
    CP_DOT,
    CP_DOLLAR,
    CP_PLUS,
    CP_QUESTION,
    CP_CLOSING_BRACE,
    CP_CLOSING_PAREN,
    CP_OPENING_BRACE,
    CP_OPENING_BRACKET,
    CP_OPENING_PAREN,
    CP_PIPE,
    CP_MINUS,
    canUnwrapped,
    CP_HASH,
    CP_PERCENT,
    CP_BAN,
    CP_AMP,
    CP_COMMA,
    CP_COLON,
    CP_SEMI,
    CP_LT,
    CP_EQ,
    CP_GT,
    CP_AT,
    CP_TILDE,
    CP_BACKTICK,
} from "../utils"

const REGEX_CHAR_CLASS_ESCAPES = new Set([
    CP_BACK_SLASH, // \\
    CP_CLOSING_BRACKET, // ]
    CP_MINUS, // -
])
const REGEX_CLASS_SET_CHAR_CLASS_ESCAPE = new Set([
    CP_BACK_SLASH, // \\
    CP_SLASH, // /
    CP_OPENING_BRACKET, // [
    CP_CLOSING_BRACKET, // ]
    CP_OPENING_BRACE, // {
    CP_CLOSING_BRACE, // }
    CP_PIPE, // |
    CP_OPENING_PAREN, // (
    CP_CLOSING_PAREN, // )
    CP_MINUS, // -,
])
const REGEX_ESCAPES = new Set([
    CP_BACK_SLASH, // \\
    CP_SLASH, // /
    CP_CARET, // ^
    CP_DOT, // .
    CP_DOLLAR, // $
    CP_STAR, // *
    CP_PLUS, // +
    CP_QUESTION, // ?
    CP_OPENING_BRACKET, // [
    CP_CLOSING_BRACKET, // ]
    CP_OPENING_BRACE, // {
    CP_CLOSING_BRACE, // }
    CP_PIPE, // |
    CP_OPENING_PAREN, // (
    CP_CLOSING_PAREN, // )
])

const POTENTIAL_ESCAPE_SEQUENCE = new Set("uxkpPq")
// A single character set of ClassSetReservedDoublePunctuator.
// && !! ## $$ %% ** ++ ,, .. :: ;; << == >> ?? @@ ^^ `` ~~ are ClassSetReservedDoublePunctuator
const REGEX_CLASS_SET_RESERVED_DOUBLE_PUNCTUATOR = new Set([
    CP_BAN, // !
    CP_HASH, // #
    CP_DOLLAR, // $
    CP_PERCENT, // %
    CP_AMP, // &
    CP_STAR, // *
    CP_PLUS, // +
    CP_COMMA, // ,
    CP_DOT, // .
    CP_COLON, // :
    CP_SEMI, // ;
    CP_LT, // <
    CP_EQ, // =
    CP_GT, // >
    CP_QUESTION, // ?
    CP_AT, // @
    CP_CARET, // ^
    CP_BACKTICK, // `
    CP_TILDE, // ~
])

export default createRule("no-useless-escape", {
    meta: {
        docs: {
            description: "disallow unnecessary escape characters in RegExp",
            category: "Stylistic Issues",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unnecessary: "Unnecessary escape character: \\{{character}}.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor({
            node,
            flags,
            pattern,
            getRegexpLocation,
            fixReplaceNode,
        }: RegExpContext): RegExpVisitor.Handlers {
            /** Report */
            function report(
                cNode: Character,
                offset: number,
                character: string,
                fix: boolean,
            ) {
                context.report({
                    node,
                    loc: getRegexpLocation(cNode, [offset, offset + 1]),
                    messageId: "unnecessary",
                    data: {
                        character,
                    },
                    fix: fix ? fixReplaceNode(cNode, character) : null,
                })
            }

            const characterClassStack: (
                | CharacterClass
                | ExpressionCharacterClass
            )[] = []
            return {
                onCharacterClassEnter: (characterClassNode) =>
                    characterClassStack.unshift(characterClassNode),
                onCharacterClassLeave: () => characterClassStack.shift(),
                onExpressionCharacterClassEnter: (characterClassNode) =>
                    characterClassStack.unshift(characterClassNode),
                onExpressionCharacterClassLeave: () =>
                    characterClassStack.shift(),
                onCharacterEnter(cNode) {
                    if (cNode.raw.startsWith("\\")) {
                        // escapes
                        const char = cNode.raw.slice(1)
                        const escapedChar = String.fromCodePoint(cNode.value)
                        if (char === escapedChar) {
                            let allowedEscapes: Set<number>
                            if (characterClassStack.length) {
                                allowedEscapes = flags.unicodeSets
                                    ? REGEX_CLASS_SET_CHAR_CLASS_ESCAPE
                                    : REGEX_CHAR_CLASS_ESCAPES
                            } else {
                                allowedEscapes = REGEX_ESCAPES
                            }
                            if (allowedEscapes.has(cNode.value)) {
                                return
                            }
                            if (characterClassStack.length) {
                                const characterClassNode =
                                    characterClassStack[0]
                                if (cNode.value === CP_CARET) {
                                    if (
                                        characterClassNode.start + 1 ===
                                        cNode.start
                                    ) {
                                        // e.g. /[\^]/
                                        return
                                    }
                                }
                                if (flags.unicodeSets) {
                                    if (
                                        REGEX_CLASS_SET_RESERVED_DOUBLE_PUNCTUATOR.has(
                                            cNode.value,
                                        )
                                    ) {
                                        if (
                                            pattern[cNode.end] === escapedChar
                                        ) {
                                            // Escaping is valid if it is a ClassSetReservedDoublePunctuator.
                                            return
                                        }
                                        const prevIndex = cNode.start - 1
                                        if (
                                            pattern[prevIndex] === escapedChar
                                        ) {
                                            if (escapedChar !== "^") {
                                                // e.g. [&\&]
                                                //        ^ // If it's the second character, it's a valid escape.
                                                return
                                            }
                                            const elementStartIndex =
                                                characterClassNode.start +
                                                1 + // opening bracket(`[`)
                                                (characterClassNode.negate
                                                    ? 1 // `negate` caret(`^`)
                                                    : 0)
                                            if (
                                                elementStartIndex <= prevIndex
                                            ) {
                                                // [^^\^], [_^\^]
                                                //    ^       ^ // If it's the second caret(`^`) character, it's a valid escape.
                                                // But [^\^] is unnecessary escape.
                                                return
                                            }
                                        }
                                    }
                                }
                            }
                            if (!canUnwrapped(cNode, char)) {
                                return
                            }
                            report(
                                cNode,
                                0,
                                char,
                                !POTENTIAL_ESCAPE_SEQUENCE.has(char),
                            )
                        }
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
