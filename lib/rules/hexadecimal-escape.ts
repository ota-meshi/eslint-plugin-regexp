import type { RegExpVisitor } from "regexpp/visitor"
import type { Character } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import {
    defineRegexpVisitor,
    createRule,
    getEscapeSequenceKind,
    EscapeSequenceKind,
} from "../utils"

export default createRule("hexadecimal-escape", {
    meta: {
        docs: {
            description: "enforce consistent usage of hexadecimal escape",
            recommended: false,
        },
        fixable: "code",
        schema: [
            {
                enum: ["always", "never"], // default always
            },
        ],
        messages: {
            expectedHexEscape:
                "Expected hexadecimal escape ('{{hexEscape}}'), but {{unexpectedKind}} escape ('{{rejectEscape}}') is used.",
            unexpectedHexEscape:
                "Unexpected hexadecimal escape ('{{hexEscape}}').",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const always = context.options[0] !== "never"

        /**
         * Verify for always
         */
        function verifyForAlways(
            { node, getRegexpLocation, fixReplaceNode }: RegExpContext,
            kind: EscapeSequenceKind,
            cNode: Character,
        ) {
            if (
                kind !== EscapeSequenceKind.unicode &&
                kind !== EscapeSequenceKind.unicodeCodePoint
            ) {
                return
            }

            const hexEscape = `\\x${cNode.value.toString(16).padStart(2, "0")}`

            context.report({
                node,
                loc: getRegexpLocation(cNode),
                messageId: "expectedHexEscape",
                data: {
                    hexEscape,
                    unexpectedKind: kind,
                    rejectEscape: cNode.raw,
                },
                fix: fixReplaceNode(cNode, hexEscape),
            })
        }

        /**
         * Verify for never
         */
        function verifyForNever(
            { node, getRegexpLocation, fixReplaceNode }: RegExpContext,
            kind: EscapeSequenceKind,
            cNode: Character,
        ) {
            if (kind !== EscapeSequenceKind.hexadecimal) {
                return
            }
            context.report({
                node,
                loc: getRegexpLocation(cNode),
                messageId: "unexpectedHexEscape",
                data: {
                    hexEscape: cNode.raw,
                },
                fix: fixReplaceNode(cNode, () => `\\u00${cNode.raw.slice(2)}`),
            })
        }

        const verify = always ? verifyForAlways : verifyForNever

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            return {
                onCharacterEnter(cNode) {
                    if (cNode.value > 0xff) {
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
