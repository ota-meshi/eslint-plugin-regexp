import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { Character } from "@eslint-community/regexpp/ast"
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
} from "../utils"

const REGEX_CHAR_CLASS_ESCAPES = new Set([
    CP_BACK_SLASH, // \\
    CP_CLOSING_BRACKET, // ]
    CP_MINUS, // -
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

const POTENTIAL_ESCAPE_SEQUENCE = new Set("uxkpP")

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

            let inCharacterClass = false
            return {
                onCharacterClassEnter() {
                    inCharacterClass = true
                },
                onCharacterClassLeave() {
                    inCharacterClass = false
                },
                onCharacterEnter(cNode) {
                    if (cNode.raw.startsWith("\\")) {
                        // escapes
                        const char = cNode.raw.slice(1)
                        if (char === String.fromCodePoint(cNode.value)) {
                            const allowedEscapes = inCharacterClass
                                ? REGEX_CHAR_CLASS_ESCAPES
                                : REGEX_ESCAPES
                            if (allowedEscapes.has(cNode.value)) {
                                return
                            }
                            if (inCharacterClass && cNode.value === CP_CARET) {
                                const target =
                                    cNode.parent.type === "CharacterClassRange"
                                        ? cNode.parent
                                        : cNode
                                const parent = target.parent
                                if (parent.type === "CharacterClass") {
                                    if (parent.elements.indexOf(target) === 0) {
                                        // e.g. /[\^]/
                                        return
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
