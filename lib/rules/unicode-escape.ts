import type { RegExpVisitor } from "regexpp/visitor"
import type { Character } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import {
    createRule,
    defineRegexpVisitor,
    getEscapeSequenceKind,
    EscapeSequenceKind,
} from "../utils"

export default createRule("unicode-escape", {
    meta: {
        docs: {
            description:
                "enforce consistent usage of unicode escape or unicode codepoint escape",
            category: "Stylistic Issues",
            recommended: false,
        },
        fixable: "code",
        schema: [
            {
                enum: ["unicodeCodePointEscape", "unicodeEscape"], // default unicodeCodePointEscape
            },
        ],
        messages: {
            expectedUnicodeCodePointEscape:
                "Expected unicode code point escape ('{{unicodeCodePointEscape}}'), but unicode escape ('{{unicodeEscape}}') is used.",
            expectedUnicodeEscape:
                "Expected unicode escape ('{{unicodeEscape}}'), but unicode code point escape ('{{unicodeCodePointEscape}}') is used.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const preferUnicodeCodePointEscape =
            context.options[0] !== "unicodeEscape"

        /**
         * Verify for unicodeCodePointEscape
         */
        function verifyForUnicodeCodePointEscape(
            { node, getRegexpLocation, fixReplaceNode }: RegExpContext,
            kind: EscapeSequenceKind,
            cNode: Character,
        ) {
            if (kind !== EscapeSequenceKind.unicode) {
                return
            }

            const unicodeCodePointEscape = `\\u{${cNode.value.toString(16)}}`

            context.report({
                node,
                loc: getRegexpLocation(cNode),
                messageId: "expectedUnicodeCodePointEscape",
                data: {
                    unicodeCodePointEscape,
                    unicodeEscape: cNode.raw,
                },
                fix: fixReplaceNode(cNode, unicodeCodePointEscape),
            })
        }

        /**
         * Verify for unicodeEscape
         */
        function verifyForUnicodeEscape(
            { node, getRegexpLocation, fixReplaceNode }: RegExpContext,
            kind: EscapeSequenceKind,
            cNode: Character,
        ) {
            if (kind !== EscapeSequenceKind.unicodeCodePoint) {
                return
            }
            const unicodeEscape = `\\u${cNode.value
                .toString(16)
                .padStart(4, "0")}`
            context.report({
                node,
                loc: getRegexpLocation(cNode),
                messageId: "expectedUnicodeEscape",
                data: {
                    unicodeEscape,
                    unicodeCodePointEscape: cNode.raw,
                },
                fix: fixReplaceNode(cNode, unicodeEscape),
            })
        }

        const verify = preferUnicodeCodePointEscape
            ? verifyForUnicodeCodePointEscape
            : verifyForUnicodeEscape

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { flags } = regexpContext
            if (!flags.unicode) {
                return {}
            }
            return {
                onCharacterEnter(cNode) {
                    if (cNode.value >= 0x10000) {
                        return
                    }
                    const kind = getEscapeSequenceKind(cNode.raw)
                    if (!kind) {
                        return
                    }

                    verify(regexpContext, kind, cNode)
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
