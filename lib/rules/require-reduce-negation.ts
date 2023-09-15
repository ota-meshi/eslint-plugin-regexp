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
type NegateCharacterClassElement = NegatableCharacterClassElement & {
    negate: true
}

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

/** Checks whether the given character class is negate. */
function isNegate<
    N extends CharacterClassElement | CharacterClass | ClassIntersection,
>(node: N): node is N & NegateCharacterClassElement {
    return isNegatableCharacterClassElement(node) && node.negate
}

/**
 * Gets the text of a character class that negates the given character class.
 */
function getRawTextToNot(negateNode: NegateCharacterClassElement) {
    const raw = negateNode.raw
    if (
        negateNode.type === "CharacterClass" ||
        negateNode.type === "ExpressionCharacterClass"
    ) {
        return `${raw[0]}${raw.slice(2)}`
    }
    // else if (node.type === "CharacterSet") {
    const escapeChar = negateNode.raw[1].toLowerCase()
    return `${raw[0]}${escapeChar}${raw.slice(2)}`
}

/** Collect the operands from the given intersection expression */
function collectIntersectionOperands(
    expression: ClassIntersection,
): ClassSetOperand[] {
    const operands: ClassSetOperand[] = []
    let operand: ClassIntersection | ClassSetOperand = expression
    while (operand.type === "ClassIntersection") {
        operands.unshift(operand.right)
        operand = operand.left
    }
    operands.unshift(operand)
    return operands
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
                    if (toNegationOfDisjunction(eccNode)) {
                        return
                    }
                    if (toSubtraction(eccNode)) {
                        return
                    }
                    verifyExpressions(eccNode)
                },
            }

            /**
             * Reports if the fixed pattern is compatible with the original pattern.
             * Returns true if reported.
             */
            function reportWhenFixedIsCompatible({
                reportNode,
                targetNode,
                messageId,
                data,
                fix,
            }: {
                reportNode:
                    | CharacterClass
                    | ExpressionCharacterClass
                    | ClassIntersection
                    | ClassSubtraction
                targetNode: CharacterClass | ExpressionCharacterClass
                messageId:
                    | "doubleNegationElimination"
                    | "toNegationOfDisjunction"
                    | "toNegationOfConjunction"
                    | "toSubtraction"
                    | "toIntersection"
                data?: Record<string, string>
                fix: () => string
            }) {
                const us = toUnicodeSet(targetNode, flags)
                const fixedText = fix()
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
                    loc: getRegexpLocation(reportNode),
                    messageId,
                    data: data || {},
                    fix: fixReplaceNode(targetNode, fixedText),
                })
                return true
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
                    toIntersection(operand, right, eccNode)
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
                if (!isNegate(element)) {
                    return false
                }
                return reportWhenFixedIsCompatible({
                    reportNode: ccNode,
                    targetNode: ccNode,
                    messageId: "doubleNegationElimination",
                    fix: () => `[${getRawTextToNot(element)}]`,
                })
            }

            /**
             * Checks the given character class and reports if it can be converted to the negation of a disjunction
             * using De Morgan's laws.
             * Returns true if reported.
             *
             * e.g.
             * - `[[^a]&&[^b]]` -> `[^ab]`
             * - `[^[^a]&&[^b]]` -> `[ab]`
             * - `[[^a]&&[^b]&&c]` -> `[[^ab]&&c]`
             */
            function toNegationOfDisjunction(
                eccNode: ExpressionCharacterClass,
            ) {
                const expression = eccNode.expression
                if (expression.type !== "ClassIntersection") {
                    return false
                }
                const operands = collectIntersectionOperands(expression)
                const negateOperands: (NegateCharacterClassElement &
                    ClassSetOperand)[] = []
                const others: ClassSetOperand[] = []
                for (const e of operands) {
                    if (isNegate(e)) {
                        negateOperands.push(e)
                    } else {
                        others.push(e)
                    }
                }
                const fixedOperands = negateOperands
                    .map((negateOperand) => getRawTextToNot(negateOperand))
                    .join("")
                if (negateOperands.length === operands.length) {
                    return reportWhenFixedIsCompatible({
                        reportNode: eccNode,
                        targetNode: eccNode,
                        messageId: "toNegationOfDisjunction",
                        data: {
                            target: "character class",
                        },
                        fix: () =>
                            `[${eccNode.negate ? "" : "^"}${fixedOperands}]`,
                    })
                }
                if (negateOperands.length < 2) {
                    return null
                }
                return reportWhenFixedIsCompatible({
                    reportNode: negateOperands[negateOperands.length - 1]
                        .parent as ClassIntersection,
                    targetNode: eccNode,
                    messageId: "toNegationOfDisjunction",
                    data: {
                        target: "expression",
                    },
                    fix: () => {
                        const operandTestList = [
                            `[^${fixedOperands}]`,
                            ...others.map((e) => e.raw),
                        ]
                        return `[${
                            eccNode.negate ? "^" : ""
                        }${operandTestList.join("&&")}]`
                    },
                })
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
                const elements: CharacterClassElement[] = ccNode.elements
                const negateElements = elements.filter(isNegate)
                if (negateElements.length !== elements.length) {
                    return false
                }
                return reportWhenFixedIsCompatible({
                    reportNode: ccNode,
                    targetNode: ccNode,
                    messageId: "toNegationOfConjunction",
                    fix: () => {
                        const fixedElements = negateElements.map(
                            (negateElement) => getRawTextToNot(negateElement),
                        )
                        return `[${
                            ccNode.negate ? "" : "^"
                        }${fixedElements.join("&&")}]`
                    },
                })
            }

            /**
             * Checks the given expression and reports whether it can be converted to subtraction by reducing its complement.
             * Returns true if reported.
             *
             * e.g.
             * - `[a&&[^b]]` -> `[a--b]`
             * - `[[^a]&&b]` -> `[b--a]`
             * - `[a&&[^b]&&c]` -> `[[a&&c]--b]`
             */
            function toSubtraction(eccNode: ExpressionCharacterClass) {
                const expression = eccNode.expression
                if (expression.type !== "ClassIntersection") {
                    return false
                }
                const operands = collectIntersectionOperands(expression)
                const negateOperand = operands.find(isNegate)
                if (!negateOperand) {
                    return false
                }
                return reportWhenFixedIsCompatible({
                    reportNode: expression,
                    targetNode: eccNode,
                    messageId: "toSubtraction",
                    fix() {
                        const others = operands.filter(
                            (e) => e !== negateOperand,
                        )
                        let fixedLeftText = others.map((e) => e.raw).join("&&")
                        if (others.length >= 2) {
                            // Wrap with brackets
                            fixedLeftText = `[${fixedLeftText}]`
                        }
                        const fixedRightText = getRawTextToNot(negateOperand)
                        return `[${
                            eccNode.negate ? "^" : ""
                        }${`${fixedLeftText}--${fixedRightText}`}]`
                    },
                })
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
                eccNode: ExpressionCharacterClass,
            ) {
                if (expression.type !== "ClassSubtraction") {
                    return false
                }
                const { left, right } = expression
                if (!isNegate(right)) {
                    return false
                }
                return reportWhenFixedIsCompatible({
                    reportNode: expression,
                    targetNode: eccNode,
                    messageId: "toIntersection",
                    fix() {
                        let fixedLeftText = left.raw
                        if (left.type === "ClassSubtraction") {
                            // Wrap with brackets
                            fixedLeftText = `[${fixedLeftText}]`
                        }
                        const fixedRightText = getRawTextToNot(right)
                        let fixedText = `${fixedLeftText}&&${fixedRightText}`

                        if (expressionRight) {
                            // Wrap with brackets
                            fixedText = `[${fixedText}]`
                        }
                        const targetRaw = eccNode.raw
                        return `${targetRaw.slice(
                            0,
                            expression.start - eccNode.start,
                        )}${fixedText}${targetRaw.slice(
                            expression.end - eccNode.start,
                        )}`
                    },
                })
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
                    element.type !== "Assertion" &&
                    element.type !== "Quantifier" &&
                    element.type !== "CapturingGroup" &&
                    element.type !== "Group" &&
                    element.type !== "Backreference"
                )
                    return element
            }
    } catch (_error) {
        // ignore
    }
    return null
}
