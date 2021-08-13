import { mention } from "../utils/mention"
import { RegExpValidator } from "regexpp"
import type { CharacterClassElement, Element } from "regexpp/ast"
import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import {
    isOctalEscape,
    createRule,
    defineRegexpVisitor,
    isEscapeSequence,
} from "../utils"

const validator = new RegExpValidator({ strict: true, ecmaVersion: 2020 })

/**
 * Check syntax error in a given pattern.
 * @returns The syntax error.
 */
function validateRegExpPattern(
    pattern: string,
    uFlag?: boolean,
): string | null {
    try {
        validator.validatePattern(pattern, undefined, undefined, uFlag)
        return null
    } catch (err) {
        return err.message
    }
}

const CHARACTER_CLASS_SYNTAX_CHARACTERS = new Set("\\/()[]{}^$.|-+*?".split(""))
const SYNTAX_CHARACTERS = new Set("\\/()[]{}^$.|+*?".split(""))

export default createRule("strict", {
    meta: {
        docs: {
            description: "disallow not strictly valid regular expressions",
            category: "Possible Errors",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            // character escape
            invalidControlEscape:
                "Invalid or incomplete control escape sequence. Either use a valid control escape sequence or escaping the standalone backslash.",
            incompleteEscapeSequence:
                "Incomplete escape sequence {{expr}}. Either use a valid escape sequence or remove the useless escaping.",
            invalidPropertyEscape:
                "Invalid property escape sequence {{expr}}. Either use a valid property escape sequence or remove the useless escaping.",
            incompleteBackreference:
                "Incomplete backreference {{expr}}. Either use a valid backreference or remove the useless escaping.",
            unescapedSourceCharacter: "Unescaped source character {{expr}}.",
            octalEscape:
                "Invalid legacy octal escape sequence {{expr}}. Use a hexadecimal escape instead.",
            uselessEscape:
                "Useless identity escapes with non-syntax characters are forbidden.",

            // character class
            invalidRange:
                "Invalid character class range. A character set cannot be the minimum or maximum of a character class range. Either escape the `-` or fix the character class range.",

            // assertion
            quantifiedAssertion:
                "Assertion are not allowed to be quantified directly.",

            // validator
            regexMessage: "{{message}}.",

            // suggestions
            hexEscapeSuggestion:
                "Replace the octal escape with a hexadecimal escape.",
        },
        type: "suggestion",
        hasSuggestions: true,
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const {
                node,
                flags,
                pattern,
                getRegexpLocation,
                fixReplaceNode,
            } = regexpContext

            if (flags.unicode) {
                // the Unicode flag enables strict parsing mode automatically
                return {}
            }

            let reported = false
            let hasNamedBackreference = false

            /** Report */
            function report(
                messageId: string,
                element: Element,
                fix?: string | null | { fix: string; messageId: string },
            ): void {
                reported = true

                if (fix && typeof fix === "object") {
                    context.report({
                        node,
                        loc: getRegexpLocation(element),
                        messageId,
                        data: {
                            expr: mention(element),
                        },
                        suggest: [
                            {
                                messageId: fix.messageId,
                                fix: fixReplaceNode(element, fix.fix),
                            },
                        ],
                    })
                } else {
                    context.report({
                        node,
                        loc: getRegexpLocation(element),
                        messageId,
                        data: {
                            expr: mention(element),
                        },
                        fix: fix ? fixReplaceNode(element, fix) : null,
                    })
                }
            }

            return {
                // eslint-disable-next-line complexity -- x
                onCharacterEnter(cNode) {
                    if (cNode.raw === "\\") {
                        // e.g. \c5 or \c
                        report("invalidControlEscape", cNode)
                        return
                    }
                    if (cNode.raw === "\\u" || cNode.raw === "\\x") {
                        // e.g. \u000;
                        report("incompleteEscapeSequence", cNode)
                        return
                    }
                    if (cNode.raw === "\\p" || cNode.raw === "\\P") {
                        // e.g. \p{H} or \p
                        report("invalidPropertyEscape", cNode)
                        return
                    }
                    if (cNode.value !== 0 && isOctalEscape(cNode.raw)) {
                        // e.g. \023, \34

                        // this could be confused with a backreference
                        // use a suggestion instead of a fix
                        report("octalEscape", cNode, {
                            fix: `\\x${cNode.value
                                .toString(16)
                                .padStart(2, "0")}`,
                            messageId: "hexEscapeSuggestion",
                        })
                        return
                    }

                    const insideCharClass =
                        cNode.parent.type === "CharacterClass" ||
                        cNode.parent.type === "CharacterClassRange"

                    if (!insideCharClass) {
                        if (cNode.raw === "\\k") {
                            // e.g. \k<foo or \k
                            report("incompleteBackreference", cNode)
                            return
                        }

                        if (
                            cNode.raw === "{" ||
                            cNode.raw === "}" ||
                            cNode.raw === "]"
                        ) {
                            report(
                                "unescapedSourceCharacter",
                                cNode,
                                `\\${cNode.raw}`,
                            )
                            return
                        }
                    }

                    if (isEscapeSequence(cNode.raw)) {
                        // all remaining escape sequences are valid
                        return
                    }

                    if (cNode.raw.startsWith("\\")) {
                        const identity = cNode.raw.slice(1)
                        const syntaxChars = insideCharClass
                            ? CHARACTER_CLASS_SYNTAX_CHARACTERS
                            : SYNTAX_CHARACTERS

                        if (
                            cNode.value === identity.charCodeAt(0) &&
                            !syntaxChars.has(identity)
                        ) {
                            // e.g. \g or \;
                            report("uselessEscape", cNode, identity)
                        }
                    }
                },
                onCharacterClassEnter(ccNode) {
                    for (let i = 0; i < ccNode.elements.length; i++) {
                        const current = ccNode.elements[i]

                        if (current.type === "CharacterSet") {
                            const next: CharacterClassElement | undefined =
                                ccNode.elements[i + 1]
                            const nextNext: CharacterClassElement | undefined =
                                ccNode.elements[i + 2]

                            if (next && next.raw === "-" && nextNext) {
                                // e.g. [\w-a]
                                report("invalidRange", current)
                                return
                            }

                            const prev: CharacterClassElement | undefined =
                                ccNode.elements[i - 1]
                            const prevPrev: CharacterClassElement | undefined =
                                ccNode.elements[i - 2]
                            if (
                                prev &&
                                prev.raw === "-" &&
                                prevPrev &&
                                prevPrev.type !== "CharacterClassRange"
                            ) {
                                // e.g. [a-\w]
                                report("invalidRange", current)
                                return
                            }
                        }
                    }
                },
                onQuantifierEnter(qNode) {
                    if (qNode.element.type === "Assertion") {
                        // e.g. \b+
                        report(
                            "quantifiedAssertion",
                            qNode,
                            `(?:${qNode.element.raw})${qNode.raw.slice(
                                qNode.element.end - qNode.start,
                            )}`,
                        )
                    }
                },

                onBackreferenceEnter(bNode) {
                    if (typeof bNode.ref === "string") {
                        hasNamedBackreference = true
                    }
                },
                onPatternLeave() {
                    if (hasNamedBackreference) {
                        // There is a bug in regexpp that causes it throw a
                        // syntax error for all non-Unicode regexes with named
                        // backreferences.
                        // TODO: Remove this workaround when the bug is fixed.
                        return
                    }

                    if (!reported) {
                        // our own logic couldn't find any problems,
                        // so let's use a real parser to do the job.

                        const message = validateRegExpPattern(
                            pattern,
                            flags.unicode,
                        )

                        if (message) {
                            context.report({
                                node,
                                messageId: "regexMessage",
                                data: {
                                    message,
                                },
                            })
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
