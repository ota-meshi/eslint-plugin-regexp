import type { RegExpVisitor } from "regexpp/visitor"
import type { CharacterClass, CharacterClassElement } from "regexpp/ast"
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

/**
 * Checks if small letter char class range
 * @param node The node to check
 */
function isSmallLetterCharacterClassRange(node: CharacterClassElement) {
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
function isCapitalLetterCharacterClassRange(node: CharacterClassElement) {
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
function isDigitCharacterClass(node: CharacterClassElement) {
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
function includesLowLineCharacterClass(node: CharacterClassElement) {
    return node.type === "Character" && node.value === CP_LOW_LINE
}

export default createRule("prefer-w", {
    meta: {
        docs: {
            description: "enforce using `\\w`",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                "Unexpected {{type}} '{{expr}}'. Use '{{instead}}' instead.",
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
            getRegexpRange,
            fixerApplyEscape,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onCharacterClassEnter(ccNode: CharacterClass) {
                    const lowerAToZ: CharacterClassElement[] = []
                    const capitalAToZ: CharacterClassElement[] = []
                    const digit: CharacterClassElement[] = []
                    const lowLine: CharacterClassElement[] = []
                    for (const element of ccNode.elements) {
                        if (isSmallLetterCharacterClassRange(element)) {
                            lowerAToZ.push(element)
                            if (flags.ignoreCase) {
                                capitalAToZ.push(element)
                            }
                        } else if (
                            isCapitalLetterCharacterClassRange(element)
                        ) {
                            capitalAToZ.push(element)
                            if (flags.ignoreCase) {
                                lowerAToZ.push(element)
                            }
                        } else if (isDigitCharacterClass(element)) {
                            digit.push(element)
                        } else if (includesLowLineCharacterClass(element)) {
                            lowLine.push(element)
                        }
                    }
                    if (
                        lowerAToZ.length &&
                        capitalAToZ.length &&
                        digit.length &&
                        lowLine.length
                    ) {
                        const unexpectedElements = [
                            ...new Set([
                                ...lowerAToZ,
                                ...capitalAToZ,
                                ...digit,
                                ...lowLine,
                            ]),
                        ].sort((a, b) => a.start - b.start)

                        if (
                            ccNode.elements.length === unexpectedElements.length
                        ) {
                            const instead = ccNode.negate ? "\\W" : "\\w"
                            context.report({
                                node,
                                loc: getRegexpLocation(ccNode),
                                messageId: "unexpected",
                                data: {
                                    type: "character class",
                                    expr: ccNode.raw,
                                    instead,
                                },
                                fix: fixReplaceNode(ccNode, instead),
                            })
                        } else {
                            context.report({
                                node,
                                loc: getRegexpLocation(ccNode),
                                messageId: "unexpected",
                                data: {
                                    type: "character class ranges",
                                    expr: `[${unexpectedElements
                                        .map((e) => e.raw)
                                        .join("")}]`,
                                    instead: "\\w",
                                },
                                *fix(fixer: Rule.RuleFixer) {
                                    const range = getRegexpRange(ccNode)
                                    if (range == null) {
                                        return
                                    }
                                    yield fixer.replaceTextRange(
                                        getRegexpRange(
                                            unexpectedElements.shift()!,
                                        )!,
                                        fixerApplyEscape("\\w"),
                                    )
                                    for (const element of unexpectedElements) {
                                        yield fixer.removeRange(
                                            getRegexpRange(element)!,
                                        )
                                    }
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
