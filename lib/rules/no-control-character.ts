import type { Character } from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { Rule } from "eslint"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { mentionChar, mention } from "../utils/mention"
import { CP_TAB, CP_LF, CP_VT, CP_FF, CP_CR } from "../utils/unicode"

const CONTROL_CHARS = new Map<number, string>([
    [0, "\\0"],
    [CP_TAB, "\\t"],
    [CP_LF, "\\n"],
    [CP_VT, "\\v"],
    [CP_FF, "\\f"],
    [CP_CR, "\\r"],
])

const ALLOWED_CONTROL_CHARS = /^\\[0fnrtv]$/u

export default createRule("no-control-character", {
    meta: {
        docs: {
            description: "disallow control characters",
            category: "Possible Errors",
            recommended: false,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected control character {{ char }}.",

            // suggestions

            escape: "Use {{ escape }} instead.",
        },
        type: "suggestion",
        hasSuggestions: true,
    },
    create(context) {
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, patternSource, getRegexpLocation, fixReplaceNode } =
                regexpContext

            function isBadEscapeRaw(raw: string, cp: number): boolean {
                return (
                    raw.codePointAt(0)! === cp ||
                    raw.startsWith("\\x") ||
                    raw.startsWith("\\u")
                )
            }

            function isAllowedEscapeRaw(raw: string): boolean {
                return (
                    ALLOWED_CONTROL_CHARS.test(raw) ||
                    (raw.startsWith("\\") &&
                        ALLOWED_CONTROL_CHARS.test(raw.slice(1)))
                )
            }

            /**
             * Whether the given char is represented using an unwanted escape
             * sequence.
             */
            function isBadEscape(char: Character): boolean {
                // We are only interested in control escapes in RegExp literals
                const range = patternSource.getReplaceRange(char)?.range
                const sourceRaw = range
                    ? context.sourceCode.text.slice(...range)
                    : char.raw

                if (
                    isAllowedEscapeRaw(char.raw) ||
                    isAllowedEscapeRaw(sourceRaw)
                ) {
                    return false
                }

                return (
                    isBadEscapeRaw(char.raw, char.value) ||
                    (char.raw.startsWith("\\") &&
                        isBadEscapeRaw(char.raw.slice(1), char.value))
                )
            }

            return {
                onCharacterEnter(cNode) {
                    if (cNode.value <= 0x1f && isBadEscape(cNode)) {
                        const suggest: Rule.SuggestionReportDescriptor[] = []

                        const allowedEscape = CONTROL_CHARS.get(cNode.value)
                        if (allowedEscape !== undefined) {
                            suggest.push({
                                messageId: "escape",
                                data: { escape: mention(allowedEscape) },
                                fix: fixReplaceNode(cNode, allowedEscape),
                            })
                        }

                        context.report({
                            node,
                            loc: getRegexpLocation(cNode),
                            messageId: "unexpected",
                            data: { char: mentionChar(cNode) },
                            suggest,
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
