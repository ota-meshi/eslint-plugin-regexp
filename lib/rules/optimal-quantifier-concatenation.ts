import type { RegExpVisitor } from "regexpp/visitor"
import type {
    Alternative,
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
import { getPossiblyConsumedChar } from "../utils/regexp-ast"
import type { CharSet } from "refa"

/**
 * Returns whether the given node is or contains a capturing group.
 */
function hasCapturingGroup(node: Node): boolean {
    return hasSomeDescendant(node, (d) => d.type === "CapturingGroup")
}

interface SingleConsumedChar {
    readonly char: CharSet
    /**
     * Whether the entire element is a single character.
     *
     * If `true`, the element is equivalent to `[char]`.
     *
     * If `false`, the element is equivalent to `[char]|unknown`.
     */
    readonly complete: boolean
}

const EMPTY_UTF16: SingleConsumedChar = {
    char: Chars.empty({}),
    complete: false,
}
const EMPTY_UNICODE: SingleConsumedChar = {
    char: Chars.empty({ unicode: true }),
    complete: false,
}

/**
 * If the given element is guaranteed to only consume a single character set,
 * then this character set will be returned, `null` otherwise.
 */
function getSingleConsumedChar(
    element: Element | Alternative,
    context: RegExpContext,
): SingleConsumedChar {
    const empty = context.flags.unicode ? EMPTY_UNICODE : EMPTY_UTF16

    switch (element.type) {
        case "Alternative":
            if (element.elements.length === 1) {
                return getSingleConsumedChar(element.elements[0], context)
            }
            return empty

        case "Character":
        case "CharacterSet":
        case "CharacterClass":
            return {
                char: context.toCharSet(element),
                complete: true,
            }

        case "Group":
        case "CapturingGroup": {
            const results = element.alternatives.map((a) =>
                getSingleConsumedChar(a, context),
            )

            return {
                char: empty.char.union(...results.map((r) => r.char)),
                complete: results.every((r) => r.complete),
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
    const lSingle = getSingleConsumedChar(left.element, context)
    const rSingle = getSingleConsumedChar(right.element, context)
    const lPossibleChar = lSingle.complete
        ? lSingle.char
        : getPossiblyConsumedChar(left.element, context).char
    const rPossibleChar = rSingle.complete
        ? rSingle.char
        : getPossiblyConsumedChar(right.element, context).char
    const greedy = left.greedy

    let lQuant: Readonly<Quant>, rQuant: Readonly<Quant>
    if (
        lSingle.complete &&
        rSingle.complete &&
        lSingle.char.equals(rSingle.char)
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
        rSingle.char.isSupersetOf(lPossibleChar)
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
        lSingle.char.isSupersetOf(rPossibleChar)
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
    const lSingle = getSingleConsumedChar(left.element, context)
    if (!lSingle.complete) {
        return null
    }

    const rSingle = getSingleConsumedChar(right.element, context)
    if (!rSingle.complete) {
        return null
    }

    if (!rSingle.char.equals(lSingle.char)) {
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
 * Whether the computed replacement is to be ignored.
 */
function ignoreReplacement(
    left: Element,
    right: Element,
    result: Replacement,
): boolean {
    // There is a relatively common case for which we want to make
    // an exception: `aa?`
    // We will only suggest the replacement if the new raw is
    // shorter than the current one.
    if (left.type === "Quantifier") {
        if (
            left.raw.length + right.raw.length <= result.raw.length &&
            isGroupOrCharacter(right) &&
            left.min === 0 &&
            left.max === 1
        ) {
            return true
        }
    }
    if (right.type === "Quantifier") {
        if (
            left.raw.length + right.raw.length <= result.raw.length &&
            isGroupOrCharacter(left) &&
            right.min === 0 &&
            right.max === 1
        ) {
            return true
        }
    }
    return false
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
        if (result && !ignoreReplacement(left, right, result)) return result
    }

    if (left.type === "Quantifier") {
        const rightRep = asRepeatedElement(right)
        if (rightRep) {
            const result = getQuantifierRepeatedElementReplacement(
                [left, rightRep],
                context,
            )
            if (result && !ignoreReplacement(left, right, result)) return result
        }
    }

    if (right.type === "Quantifier") {
        const leftRep = asRepeatedElement(left)
        if (leftRep) {
            const result = getQuantifierRepeatedElementReplacement(
                [leftRep, right],
                context,
            )
            if (result && !ignoreReplacement(left, right, result)) return result
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
            category: "Best Practices",
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
