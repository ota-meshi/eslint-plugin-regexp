import type { RegExpVisitor } from "regexpp/visitor"
import type {
    CapturingGroup,
    Character,
    CharacterClass,
    CharacterSet,
    Element,
    Group,
    Node,
    QuantifiableElement,
    Quantifier,
} from "regexpp/ast"
import type { AST, SourceCode } from "eslint"
import type { RegExpContext, Quant } from "../utils"
import { createRule, defineRegexpVisitor, quantToString } from "../utils"
import { Chars, hasSomeDescendant } from "regexp-ast-analysis"
import type { CharSet } from "refa"

/**
 * Returns whether the given node is or contains a capturing group.
 */
function hasCapturingGroup(node: Node): boolean {
    return hasSomeDescendant(node, (d) => d.type === "CapturingGroup")
}

interface Chars {
    readonly chars: CharSet
    readonly complete: boolean
}

const EMPTY_UTF16: Chars = {
    chars: Chars.empty({}),
    complete: false,
}
const EMPTY_UNICODE: Chars = {
    chars: Chars.empty({ unicode: true }),
    complete: false,
}

/**
 * Creates a `Chars` object from the given element.
 */
function createChars(element: Element, context: RegExpContext): Chars {
    const empty = context.flags.unicode ? EMPTY_UNICODE : EMPTY_UTF16

    switch (element.type) {
        case "Character":
        case "CharacterSet":
            return {
                chars: context.toCharSet(element),
                complete: true,
            }

        case "CharacterClass":
            return {
                chars: context.toCharSet(element),
                complete: true,
            }

        case "Group":
        case "CapturingGroup": {
            const results = element.alternatives.map((a) => {
                if (a.elements.length === 1) {
                    return createChars(a.elements[0], context)
                }
                return empty
            })
            const union = empty.chars.union(
                ...results.map(({ chars }) => chars),
            )
            return {
                chars: union,
                complete: results.every(({ complete }) => complete),
            }
        }

        default:
            return empty
    }
}

/**
 * Returns the sum of the given quant and constant.
 */
function quantAddConst(quant: Readonly<Quant>, constant: number): Quant {
    return {
        min: quant.min + constant,
        max: quant.max + constant,
        greedy: quant.greedy,
    }
}

/**
 * Returns the raw of the given quantifier.
 */
function quantize(element: QuantifiableElement, quant: Quant): string {
    if (quant.min === 0 && quant.max === 0) {
        return ""
    }
    if (quant.min === 1 && quant.max === 1) {
        return element.raw
    }
    return element.raw + quantToString(quant)
}

type GroupOrCharacter =
    | Group
    | CapturingGroup
    | Character
    | CharacterClass
    | CharacterSet

/**
 * Returns whether the given element is a group or character.
 */
function isGroupOrCharacter(element: Element): element is GroupOrCharacter {
    switch (element.type) {
        case "Group":
        case "CapturingGroup":
        case "Character":
        case "CharacterClass":
        case "CharacterSet":
            return true
        default:
            return false
    }
}

interface Replacement {
    raw: string
    messageId: string
}

/* eslint-disable complexity -- x */
/**
 * Returns the replacement for the two adjacent elements.
 */
function getQuantifiersReplacement(
    /* eslint-enable complexity -- x */
    left: Quantifier,
    right: Quantifier,
    context: RegExpContext,
): Replacement | null {
    // this only handles quantifiers that aren't simple repetitions
    // e.g. `a*\w*` will be handled but `a{6}\w` will not be.
    if (left.min === left.max || right.min === right.max) {
        return null
    }

    // both quantifiers must have the same greediness
    if (left.greedy !== right.greedy) {
        return null
    }

    // compare
    const lChars = createChars(left.element, context)
    const rChars = createChars(right.element, context)
    const greedy = left.greedy

    let lQuant: Readonly<Quant>, rQuant: Readonly<Quant>
    if (
        lChars.complete &&
        rChars.complete &&
        lChars.chars.equals(rChars.chars)
    ) {
        // left is equal to right
        lQuant = {
            min: left.min + right.min,
            max: left.max + right.max,
            greedy,
        }
        rQuant = { min: 0, max: 0, greedy }
    } else if (
        right.max === Infinity &&
        lChars.complete &&
        lChars.chars.isSubsetOf(rChars.chars)
    ) {
        // left is a subset of right
        lQuant = {
            min: left.min,
            max: left.min,
            greedy,
        }
        rQuant = right // unchanged
    } else if (
        left.max === Infinity &&
        rChars.complete &&
        rChars.chars.isSubsetOf(lChars.chars)
    ) {
        // right is a subset of left
        lQuant = left // unchanged
        rQuant = {
            min: right.min,
            max: right.min,
            greedy,
        }
    } else {
        return null
    }

    const raw = quantize(left.element, lQuant) + quantize(right.element, rQuant)

    // eslint-disable-next-line one-var -- rule error
    let message
    if (
        lQuant.max === 0 &&
        right.max === rQuant.max &&
        right.min === rQuant.min
    ) {
        message = "removeLeft"
    } else if (
        rQuant.max === 0 &&
        left.max === lQuant.max &&
        left.min === lQuant.min
    ) {
        message = "removeRight"
    } else {
        message = "replace"
    }

    return { raw, messageId: message }
}

/**
 * A element that is repeated a constant number of times.
 */
interface RepeatedElement {
    type: "Repeated"
    element: GroupOrCharacter
    min: number
}

/**
 * Tries to convert the given element into a repeated element.
 */
function asRepeatedElement(element: Element): RepeatedElement | null {
    if (element.type === "Quantifier") {
        if (
            element.min === element.max &&
            element.min > 0 &&
            isGroupOrCharacter(element.element)
        ) {
            return {
                type: "Repeated",
                element: element.element,
                min: element.min,
            }
        }
    } else if (isGroupOrCharacter(element)) {
        return { type: "Repeated", element, min: 1 }
    }

    return null
}

/**
 * Returns the replacement for the two adjacent elements.
 */
function getQuantifierRepeatedElementReplacement(
    pair: [Quantifier, RepeatedElement] | [RepeatedElement, Quantifier],
    context: RegExpContext,
): Replacement | null {
    const [left, right] = pair

    // the characters of both elements have to be complete and equal
    const leftChar = createChars(left.element, context)
    if (!leftChar.complete) {
        return null
    }

    const rightChar = createChars(right.element, context)
    if (!rightChar.complete) {
        return null
    }

    if (!rightChar.chars.equals(leftChar.chars)) {
        return null
    }

    let elementRaw, quant
    if (left.type === "Quantifier") {
        elementRaw = left.element.raw
        quant = quantAddConst(left, right.min)
    } else if (right.type === "Quantifier") {
        elementRaw = right.element.raw
        quant = quantAddConst(right, left.min)
    } else {
        throw new Error()
    }

    const raw = elementRaw + quantToString(quant)

    return { messageId: "combine", raw }
}

/**
 * Returns the replacement for the two adjacent elements.
 */
function getReplacement(
    left: Element,
    right: Element,
    context: RegExpContext,
): Replacement | null {
    if (left.type === "Quantifier" && right.type === "Quantifier") {
        const result = getQuantifiersReplacement(left, right, context)
        if (result) return result
    }

    if (left.type === "Quantifier") {
        const rightRep = asRepeatedElement(right)
        if (rightRep) {
            const result = getQuantifierRepeatedElementReplacement(
                [left, rightRep],
                context,
            )
            if (result) return result
        }
    }

    if (right.type === "Quantifier") {
        const leftRep = asRepeatedElement(left)
        if (leftRep) {
            const result = getQuantifierRepeatedElementReplacement(
                [leftRep, right],
                context,
            )
            if (result) {
                // There is a relatively common case for which we want to make
                // an exception: `aa?`
                // We will only suggest the replacement if the new raw is
                // shorter than the current one.
                if (
                    isGroupOrCharacter(left) &&
                    right.min === 0 &&
                    right.max === 1 &&
                    left.raw.length + right.raw.length <= result.raw.length
                ) {
                    return null
                }

                return result
            }
        }
    }

    return null
}

/**
 * Returns the combined location of two adjacent elements.
 */
function getLoc(
    left: Element,
    right: Element,
    sourceCode: SourceCode,
    { getRegexpRange }: RegExpContext,
): AST.SourceLocation | undefined {
    const firstRange = getRegexpRange(left)
    const lastRange = getRegexpRange(right)

    if (firstRange && lastRange) {
        return {
            start: sourceCode.getLocFromIndex(firstRange[0]),
            end: sourceCode.getLocFromIndex(lastRange[1]),
        }
    }

    return undefined
}

export default createRule("optimal-quantifier-concatenation", {
    meta: {
        docs: {
            description:
                "require optimal quantifiers for concatenated quantifiers",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            combine:
                "'{{left}}' and '{{right}}' can be combined into one quantifier '{{fix}}'.{{cap}}",
            removeLeft:
                "'{{left}}' can be removed because it is already included by '{{right}}'.{{cap}}",
            removeRight:
                "'{{right}}' can be removed because it is already included by '{{left}}'.{{cap}}",
            replace:
                "'{{left}}' and '{{right}}' can be replaced with '{{fix}}'.{{cap}}",
        },
        type: "suggestion",
    },
    create(context) {
        /**
         * Creates a visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation, fixReplaceNode } = regexpContext

            return {
                onAlternativeEnter(aNode) {
                    for (let i = 0; i < aNode.elements.length - 1; i++) {
                        const left = aNode.elements[i]
                        const right = aNode.elements[i + 1]
                        const replacement = getReplacement(
                            left,
                            right,
                            regexpContext,
                        )

                        if (!replacement) {
                            continue
                        }

                        const involvesCapturingGroup =
                            hasCapturingGroup(left) || hasCapturingGroup(right)

                        context.report({
                            node,
                            loc:
                                getLoc(
                                    left,
                                    right,
                                    context.getSourceCode(),
                                    regexpContext,
                                ) ?? getRegexpLocation(aNode),
                            messageId: replacement.messageId,
                            data: {
                                left: left.raw,
                                right: right.raw,
                                fix: replacement.raw,
                                cap: involvesCapturingGroup
                                    ? " This cannot be fixed automatically because it might change or remove a capturing group."
                                    : "",
                            },
                            fix: fixReplaceNode(aNode, () => {
                                if (involvesCapturingGroup) {
                                    return null
                                }

                                const before = aNode.raw.slice(
                                    0,
                                    left.start - aNode.start,
                                )
                                const after = aNode.raw.slice(
                                    right.end - aNode.start,
                                )

                                return before + replacement.raw + after
                            }),
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
