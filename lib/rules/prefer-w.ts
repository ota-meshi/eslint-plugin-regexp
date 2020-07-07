import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { CharacterClass, CharacterClassElement } from "regexpp/ast"
import type { Rule } from "eslint"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    getRegexpRange,
    CP_SMALL_A,
    CP_SMALL_Z,
    CP_CAPITAL_A,
    CP_CAPITAL_Z,
    CP_DIGIT_ZERO,
    CP_DIGIT_NINE,
    CP_LOW_LINE,
    FLAG_IGNORECASE,
    fixerApplyEscape,
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
                'Unexpected character set "{{expr}}". Use "{{instead}}" instead.',
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(
            node: Expression,
            _pattern: string,
            flags: string,
        ): RegExpVisitor.Handlers {
            return {
                onCharacterClassEnter(ccNode: CharacterClass) {
                    const lowerAToZ: CharacterClassElement[] = []
                    const capitalAToZ: CharacterClassElement[] = []
                    const digit: CharacterClassElement[] = []
                    const lowLine: CharacterClassElement[] = []
                    for (const element of ccNode.elements) {
                        if (isSmallLetterCharacterClassRange(element)) {
                            lowerAToZ.push(element)
                            if (flags.includes(FLAG_IGNORECASE)) {
                                capitalAToZ.push(element)
                            }
                        } else if (
                            isCapitalLetterCharacterClassRange(element)
                        ) {
                            capitalAToZ.push(element)
                            if (flags.includes(FLAG_IGNORECASE)) {
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
                                loc: getRegexpLocation(
                                    sourceCode,
                                    node,
                                    ccNode,
                                ),
                                messageId: "unexpected",
                                data: {
                                    expr: ccNode.raw,
                                    instead,
                                },
                                fix(fixer: Rule.RuleFixer) {
                                    const range = getRegexpRange(
                                        sourceCode,
                                        node,
                                        ccNode,
                                    )
                                    if (range == null) {
                                        return null
                                    }
                                    return fixer.replaceTextRange(
                                        range,
                                        fixerApplyEscape(instead, node),
                                    )
                                },
                            })
                        } else {
                            context.report({
                                node,
                                loc: getRegexpLocation(
                                    sourceCode,
                                    node,
                                    ccNode,
                                ),
                                messageId: "unexpected",
                                data: {
                                    expr: `[${unexpectedElements
                                        .map((e) => e.raw)
                                        .join("")}]`,
                                    instead: "\\w",
                                },
                                *fix(fixer: Rule.RuleFixer) {
                                    const range = getRegexpRange(
                                        sourceCode,
                                        node,
                                        ccNode,
                                    )
                                    if (range == null) {
                                        return
                                    }
                                    yield fixer.replaceTextRange(
                                        getRegexpRange(
                                            sourceCode,
                                            node,
                                            unexpectedElements.shift()!,
                                        )!,
                                        fixerApplyEscape("\\w", node),
                                    )
                                    for (const element of unexpectedElements) {
                                        yield fixer.removeRange(
                                            getRegexpRange(
                                                sourceCode,
                                                node,
                                                element,
                                            )!,
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
