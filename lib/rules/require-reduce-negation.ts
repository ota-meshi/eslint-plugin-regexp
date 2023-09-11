import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import type {
    CharacterClass,
    CharacterClassElement,
    CharacterUnicodePropertyCharacterSet,
    ClassIntersection,
    ClassSetOperand,
    ClassSubtraction,
    EscapeCharacterSet,
    ExpressionCharacterClass,
} from "@eslint-community/regexpp/ast"
import type { ReadonlyFlags, ToUnicodeSetElement } from "regexp-ast-analysis"
import { toUnicodeSet } from "regexp-ast-analysis"
import { RegExpParser } from "@eslint-community/regexpp"

type NegatableCharacterClassElement =
    | CharacterClass
    | ExpressionCharacterClass
    | EscapeCharacterSet
    | CharacterUnicodePropertyCharacterSet

/** Checks whether the given character class is negatable. */
function isNegatableCharacterClassElement<
    N extends CharacterClassElement | CharacterClass | ClassIntersection,
>(node: N): node is N & NegatableCharacterClassElement {
    return (
        node.type === "CharacterClass" ||
        node.type === "ExpressionCharacterClass" ||
        (node.type === "CharacterSet" &&
            (node.kind !== "property" || !node.strings))
    )
}

/**
 * Gets the text of a character class that negates the given character class.
 */
function getRawTextForNot(node: NegatableCharacterClassElement) {
    const raw = node.raw
    if (
        node.type === "CharacterClass" ||
        node.type === "ExpressionCharacterClass"
    ) {
        if (node.negate) {
            return `${raw[0]}${raw.slice(2)}`
        }
        return `${raw[0]}^${raw.slice(1)}`
    }
    // else if (node.type === "CharacterSet") {
    const escapeChar = node.raw[1]
    return `${raw[0]}${
        node.negate ? escapeChar.toLowerCase() : escapeChar.toUpperCase()
    }${raw.slice(2)}`
}

export default createRule("require-reduce-negation", {
    meta: {
        docs: {
            description: "require to reduce negation of character classes",
            category: "Best Practices",
            recommended: true,
        },
        schema: [],
        messages: {
            doubleNegationElimination:
                "This character class can be double negation elimination.",
            toNegationOfDisjunction:
                "This {{target}} can be converted to the negation of a disjunction using De Morgan's laws.",
            toNegationOfConjunction:
                "This character class can be converted to the negation of a conjunction using De Morgan's laws.",
            toSubtraction:
                "This expression can be converted to the subtraction.",
            toIntersection:
                "This expression can be converted to the intersection.",
        },
        fixable: "code",
        type: "suggestion",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, flags, getRegexpLocation, fixReplaceNode } =
                regexpContext
            return {
                onCharacterClassEnter(ccNode) {
                    if (doubleNegationElimination(ccNode)) {
                        return
                    }
                    toNegationOfConjunction(ccNode)
                },
                onExpressionCharacterClassEnter(eccNode) {
                    if (toNegationOfDisjunctionForCharacterClass(eccNode)) {
                        return
                    }
                    verifyExpressions(eccNode)
                },
            }

            /** Verify for intersections and subtractions */
            function verifyExpressions(eccNode: ExpressionCharacterClass) {
                let operand:
                    | ClassIntersection
                    | ClassSubtraction
                    | ClassSetOperand = eccNode.expression
                let right:
                    | ClassIntersection
                    | ClassSubtraction
                    | ClassSetOperand
                    | null = null
                while (
                    operand.type === "ClassIntersection" ||
                    operand.type === "ClassSubtraction"
                ) {
                    if (toNegationOfDisjunctionForExpression(operand)) {
                        return
                    }
                    void (
                        toSubtraction(operand, right) ||
                        toIntersection(operand, right)
                    )
                    right = operand.right
                    operand = operand.left
                }
            }

            /**
             * Checks the given character class and reports if double negation elimination
             * is possible.
             * Returns true if reported.
             *
             * e.g.
             * - `[^[^abc]]` -> `[abc]`
             * - `[^\D]` -> `[\d]`
             */
            function doubleNegationElimination(ccNode: CharacterClass) {
                if (!ccNode.negate && ccNode.elements.length !== 1) {
                    return false
                }
                const element = ccNode.elements[0]
                if (
                    !isNegatableCharacterClassElement(element) ||
                    !element.negate
                ) {
                    return false
                }
                const complementElement: NegatableCharacterClassElement = {
                    ...element,
                    negate: false,
                }

                const us = toUnicodeSet(ccNode, flags)
                const convertedUs = toUnicodeSet(complementElement, flags)
                if (!us.equals(convertedUs)) {
                    return false
                }
                context.report({
                    node,
                    loc: getRegexpLocation(ccNode),
                    messageId: "doubleNegationElimination",
                    fix: fixReplaceNode(ccNode, () => {
                        let fixedElementText = getRawTextForNot(element)
                        if (
                            element.type === "CharacterClass" &&
                            element.negate
                        ) {
                            // Remove brackets
                            fixedElementText = fixedElementText.slice(1, -1)
                        }

                        return `[${fixedElementText}]`
                    }),
                })
                return true // reported
            }

            /**
             * Checks the given character class and reports if it can be converted to the negation of a disjunction
             * using De Morgan's laws.
             * Returns true if reported.
             *
             * e.g.
             * - `[[^a]&&[^b]]` -> `[^ab]`
             * - `[^[^a]&&[^b]]` -> `[ab]`
             */
            function toNegationOfDisjunctionForCharacterClass(
                eccNode: ExpressionCharacterClass,
            ) {
                return toNegationOfDisjunction(
                    eccNode.expression,
                    eccNode,
                    (fixedElements) => {
                        return `[${eccNode.negate ? "" : "^"}${fixedElements}]`
                    },
                )
            }

            /**
             * Checks the given expression and reports if it can be converted to the negation of a disjunction
             * using De Morgan's laws.
             * Returns true if reported.
             *
             * e.g.
             * - `[[^a]&&[^b]&&c]` -> `[[^ab]&&c]`
             */
            function toNegationOfDisjunctionForExpression(
                expression: ClassIntersection | ClassSubtraction,
            ) {
                return toNegationOfDisjunction(
                    expression,
                    expression,
                    (fixedElements) => {
                        return `[^${fixedElements}]`
                    },
                )
            }

            /**
             * Checks the given expression and reports if it can be converted to the negation of a disjunction
             * using De Morgan's laws.
             * Returns true if reported.
             */
            function toNegationOfDisjunction(
                expression: ClassIntersection | ClassSubtraction,
                targetNode:
                    | ExpressionCharacterClass
                    | ClassIntersection
                    | ClassSubtraction,
                postFix: (fixedElements: string) => string,
            ) {
                if (expression.type !== "ClassIntersection") {
                    return false
                }
                const operands: ClassSetOperand[] = []
                let operand: ClassIntersection | ClassSetOperand = expression
                while (operand.type === "ClassIntersection") {
                    operands.unshift(operand.right)
                    operand = operand.left
                }
                operands.unshift(operand)
                const elements = operands
                    .filter(isNegatableCharacterClassElement)
                    .filter((e) => e.negate)
                if (elements.length !== operands.length) {
                    return false
                }
                const us = toUnicodeSet(targetNode, flags)
                const fixedElements = elements.map((element) => {
                    let fixedElementText = getRawTextForNot(element)
                    if (element.type === "CharacterClass" && element.negate) {
                        // Remove brackets
                        fixedElementText = fixedElementText.slice(1, -1)
                    }
                    return fixedElementText
                })
                const fixedText = postFix(fixedElements.join(""))
                const convertedElement = getParsedElement(fixedText, flags)
                if (!convertedElement) {
                    return false
                }
                const convertedUs = toUnicodeSet(convertedElement, flags)
                if (!us.equals(convertedUs)) {
                    return false
                }
                context.report({
                    node,
                    loc: getRegexpLocation(targetNode),
                    messageId: "toNegationOfDisjunction",
                    data: {
                        target:
                            targetNode.type === "ExpressionCharacterClass"
                                ? "character class"
                                : "expression",
                    },
                    fix: fixReplaceNode(targetNode, fixedText),
                })
                return true // reported
            }

            /**
             * Checks the given character class and reports if it can be converted to the negation of a conjunction
             * using De Morgan's laws.
             * Returns true if reported.
             *
             * e.g.
             * - `[[^a][^b]]` -> `[^a&&b]`
             */
            function toNegationOfConjunction(ccNode: CharacterClass) {
                if (ccNode.elements.length <= 1 || !flags.unicodeSets) {
                    return false
                }
                const operands: CharacterClassElement[] = ccNode.elements
                const elements = operands
                    .filter(isNegatableCharacterClassElement)
                    .filter((e) => e.negate)
                if (elements.length !== operands.length) {
                    return false
                }
                const us = toUnicodeSet(ccNode, flags)
                const fixedElements = elements.map((element) => {
                    let fixedElementText = getRawTextForNot(element)
                    if (
                        element.type === "CharacterClass" &&
                        element.negate &&
                        element.elements.length === 1
                    ) {
                        // Remove brackets
                        fixedElementText = fixedElementText.slice(1, -1)
                    }
                    return fixedElementText
                })
                const fixedText = `[${
                    ccNode.negate ? "" : "^"
                }${fixedElements.join("&&")}]`
                const convertedElement = getParsedElement(fixedText, flags)
                if (!convertedElement) {
                    return false
                }
                const convertedUs = toUnicodeSet(convertedElement, flags)
                if (!us.equals(convertedUs)) {
                    return false
                }
                context.report({
                    node,
                    loc: getRegexpLocation(ccNode),
                    messageId: "toNegationOfConjunction",
                    fix: fixReplaceNode(ccNode, fixedText),
                })
                return true // reported
            }

            /**
             * Checks the given expression and reports whether it can be converted to subtraction by reducing its complement.
             * Returns true if reported.
             *
             * e.g.
             * - `[a&&[^b]]` -> `[a--b]`
             * - `[[^a]&&b]` -> `[b--a]`
             */
            function toSubtraction(
                expression: ClassIntersection | ClassSubtraction,
                expressionRight:
                    | ClassIntersection
                    | ClassSubtraction
                    | ClassSetOperand
                    | null,
            ) {
                if (expression.type !== "ClassIntersection") {
                    return false
                }
                const { left, right } = expression

                let fixedLeft: ClassSetOperand | ClassIntersection,
                    fixedRight: ClassSetOperand & NegatableCharacterClassElement
                if (isNegatableCharacterClassElement(left) && left.negate) {
                    fixedLeft = right
                    fixedRight = left
                } else if (
                    isNegatableCharacterClassElement(right) &&
                    right.negate
                ) {
                    fixedLeft = left
                    fixedRight = right
                } else {
                    return false
                }
                const us = toUnicodeSet(expression, flags)
                let fixedLeftText = fixedLeft.raw
                if (fixedLeft.type === "ClassIntersection") {
                    // Wrap with brackets
                    fixedLeftText = `[${fixedLeftText}]`
                }
                let fixedRightText = getRawTextForNot(fixedRight)
                if (
                    fixedRight.type === "CharacterClass" &&
                    fixedRight.negate &&
                    fixedRight.elements.length === 1
                ) {
                    // Remove brackets
                    fixedRightText = fixedRightText.slice(1, -1)
                }
                let fixedText = `${fixedLeftText}--${fixedRightText}`
                if (expressionRight) {
                    // Wrap with brackets
                    fixedText = `[${fixedText}]`
                }
                const convertedElement = getParsedElement(
                    `[${fixedText}]`,
                    flags,
                )
                if (!convertedElement) {
                    return false
                }
                const convertedUs = toUnicodeSet(convertedElement, flags)
                if (!us.equals(convertedUs)) {
                    return false
                }
                context.report({
                    node,
                    loc: getRegexpLocation(expression),
                    messageId: "toSubtraction",
                    fix: fixReplaceNode(expression, fixedText),
                })
                return true // reported
            }

            /**
             * Checks the given expression and reports whether it can be converted to intersection by reducing its complement.
             * Returns true if reported.
             *
             * e.g.
             * - `[a--[^b]]` -> `[a&&b]`
             */
            function toIntersection(
                expression: ClassIntersection | ClassSubtraction,
                expressionRight:
                    | ClassIntersection
                    | ClassSubtraction
                    | ClassSetOperand
                    | null,
            ) {
                if (expression.type !== "ClassSubtraction") {
                    return false
                }
                const { left, right } = expression
                if (!isNegatableCharacterClassElement(right) || !right.negate) {
                    return false
                }

                const us = toUnicodeSet(expression, flags)
                let fixedLeftText = left.raw
                if (left.type === "ClassSubtraction") {
                    // Wrap with brackets
                    fixedLeftText = `[${fixedLeftText}]`
                }
                let fixedRightText = getRawTextForNot(right)
                if (
                    right.type === "CharacterClass" &&
                    right.negate &&
                    right.elements.length === 1
                ) {
                    // Remove brackets
                    fixedRightText = fixedRightText.slice(1, -1)
                }
                let fixedText = `${fixedLeftText}&&${fixedRightText}`

                if (expressionRight) {
                    // Wrap with brackets
                    fixedText = `[${fixedText}]`
                }
                const convertedElement = getParsedElement(
                    `[${fixedText}]`,
                    flags,
                )
                if (!convertedElement) {
                    return false
                }
                const convertedUs = toUnicodeSet(convertedElement, flags)
                if (!us.equals(convertedUs)) {
                    return false
                }

                context.report({
                    node,
                    loc: getRegexpLocation(expression),
                    messageId: "toIntersection",
                    fix: fixReplaceNode(expression, fixedText),
                })
                return true // reported
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})

/** Gets the parsed result element. */
function getParsedElement(
    pattern: string,
    flags: ReadonlyFlags,
): ToUnicodeSetElement | null {
    try {
        const ast = new RegExpParser().parsePattern(
            pattern,
            undefined,
            undefined,
            {
                unicode: flags.unicode,
                unicodeSets: flags.unicodeSets,
            },
        )
        if (ast.alternatives.length === 1)
            if (ast.alternatives[0].elements.length === 1) {
                const element = ast.alternatives[0].elements[0]
                if (
                    element.type === "Assertion" ||
                    element.type === "Quantifier" ||
                    element.type === "CapturingGroup" ||
                    element.type === "Group" ||
                    element.type === "Backreference"
                )
                    return null
                return element
            }
    } catch (_error) {
        // ignore
    }
    return null
}
