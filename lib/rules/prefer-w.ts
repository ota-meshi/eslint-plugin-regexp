import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    CharacterClass,
    CharacterClassElement,
} from "@eslint-community/regexpp/ast"
import type { Rule } from "eslint"
import type { RegExpContext } from "../utils"
import {
    createRule,
    defineRegexpVisitor,
    CP_SMALL_A,
    CP_SMALL_Z,
    CP_CAPITAL_A,
    CP_CAPITAL_Z,
    CP_DIGIT_ZERO,
    CP_DIGIT_NINE,
    CP_LOW_LINE,
} from "../utils"
import { Chars, hasStrings, toUnicodeSet } from "regexp-ast-analysis"
import { mention } from "../utils/mention"
import { JS } from "refa"

/**
 * Checks if small letter char class range
 * @param node The node to check
 */
function isSmallLetterRange(node: CharacterClassElement) {
    return (
        node.type === "CharacterClassRange" &&
        node.min.value === CP_SMALL_A &&
        node.max.value === CP_SMALL_Z
    )
}

/**
 * Checks if capital letter char class range
 * @param node The node to check
 */
function isCapitalLetterRange(node: CharacterClassElement) {
    return (
        node.type === "CharacterClassRange" &&
        node.min.value === CP_CAPITAL_A &&
        node.max.value === CP_CAPITAL_Z
    )
}

/**
 * Checks if digit char class
 * @param node The node to check
 */
function isDigitRangeOrSet(node: CharacterClassElement) {
    return (
        (node.type === "CharacterClassRange" &&
            node.min.value === CP_DIGIT_ZERO &&
            node.max.value === CP_DIGIT_NINE) ||
        (node.type === "CharacterSet" && node.kind === "digit")
    )
}

/**
 * Checks if includes `_`
 * @param node The node to check
 */
function isUnderscoreCharacter(node: CharacterClassElement) {
    return node.type === "Character" && node.value === CP_LOW_LINE
}

export default createRule("prefer-w", {
    meta: {
        docs: {
            description: "enforce using `\\w`",
            category: "Stylistic Issues",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                "Unexpected {{type}} {{expr}}. Use '{{instead}}' instead.",
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
            getRegexpLocation,
            fixReplaceNode,
            patternSource,
        }: RegExpContext): RegExpVisitor.Handlers {
            const charSetWord = Chars.word(flags)
            const unicodeSetWord = JS.UnicodeSet.fromChars(charSetWord)
            const unicodeSetNegateWord = JS.UnicodeSet.fromChars(
                charSetWord.negate(),
            )
            return {
                onCharacterClassEnter(ccNode: CharacterClass) {
                    if (hasStrings(ccNode, flags)) return
                    const us = toUnicodeSet(ccNode, flags)
                    let predefined: string | undefined = undefined
                    if (us.equals(unicodeSetWord)) {
                        predefined = "\\w"
                    } else if (us.equals(unicodeSetNegateWord)) {
                        predefined = "\\W"
                    }

                    if (predefined) {
                        context.report({
                            node,
                            loc: getRegexpLocation(ccNode),
                            messageId: "unexpected",
                            data: {
                                type: "character class",
                                expr: mention(ccNode),
                                instead: predefined,
                            },
                            fix: fixReplaceNode(ccNode, predefined),
                        })
                        return
                    }

                    const lowerAToZ: CharacterClassElement[] = []
                    const capitalAToZ: CharacterClassElement[] = []
                    const digit: CharacterClassElement[] = []
                    const underscore: CharacterClassElement[] = []
                    for (const element of ccNode.elements) {
                        if (isSmallLetterRange(element)) {
                            lowerAToZ.push(element)
                            if (flags.ignoreCase) {
                                capitalAToZ.push(element)
                            }
                        } else if (isCapitalLetterRange(element)) {
                            capitalAToZ.push(element)
                            if (flags.ignoreCase) {
                                lowerAToZ.push(element)
                            }
                        } else if (isDigitRangeOrSet(element)) {
                            digit.push(element)
                        } else if (isUnderscoreCharacter(element)) {
                            underscore.push(element)
                        }
                    }

                    if (
                        lowerAToZ.length &&
                        capitalAToZ.length &&
                        digit.length &&
                        underscore.length
                    ) {
                        const unexpectedElements = [
                            ...new Set([
                                ...lowerAToZ,
                                ...capitalAToZ,
                                ...digit,
                                ...underscore,
                            ]),
                        ].sort((a, b) => a.start - b.start)

                        context.report({
                            node,
                            loc: getRegexpLocation(ccNode),
                            messageId: "unexpected",
                            data: {
                                type: "character class ranges",
                                expr: `'[${unexpectedElements
                                    .map((e) => e.raw)
                                    .join("")}]'`,
                                instead: "\\w",
                            },
                            fix(fixer: Rule.RuleFixer) {
                                const fixes: Rule.Fix[] = []
                                for (const element of unexpectedElements) {
                                    const range =
                                        patternSource.getReplaceRange(element)
                                    if (!range) {
                                        return null
                                    }

                                    if (fixes.length === 0) {
                                        // first
                                        fixes.push(range.replace(fixer, "\\w"))
                                    } else {
                                        fixes.push(range.remove(fixer))
                                    }
                                }
                                return fixes
                            },
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
