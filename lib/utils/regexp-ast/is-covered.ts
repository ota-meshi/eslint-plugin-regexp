import type {
    Alternative,
    CapturingGroup,
    Quantifier,
    Group,
    CharacterClass,
    CharacterSet,
    Node,
    Pattern,
    CharacterClassElement,
    LookaroundAssertion,
    UnicodePropertyCharacterSet,
} from "regexpp/ast"
import { isEqualNodes } from "./is-equals"
import {
    CPS_SINGLE_SPACES,
    CP_CR,
    CP_LF,
    CP_LINE_SEPARATOR,
    CP_LOW_LINE,
    CP_PARAGRAPH_SEPARATOR,
    CP_RANGES_WORDS,
    CP_RANGE_DIGIT,
    CP_RANGE_SPACES,
} from "../unicode"

interface NormalizedBase {
    readonly type: string
}

type NormalizedNode =
    | NormalizedOther
    | NormalizedCharacterRanges
    | NormalizedDisjunctions
    | NormalizedAlternative
    | NormalizedLookaroundAssertion
    | NormalizedQuantifier
class NormalizedOther implements NormalizedBase {
    public readonly type = "NormalizedOther"

    public readonly node: Node

    public static fromNode(node: Node) {
        return new NormalizedOther(node)
    }

    private constructor(node: Node) {
        this.node = node
    }
}
type NormalizedCharacterRange = NormalizedRange | NormalizedUnicodeProperty
/**
 * Code point range
 * Character, CharacterClassRange and CharacterSet are converted to this.
 */
type NormalizedRange = {
    min: number
    max: number
    type: "NormalizedRange"
}
/**
 * UnicodeProperty
 * UnicodePropertyCharacterSet is converted to this.
 */
type NormalizedUnicodeProperty = {
    node: UnicodePropertyCharacterSet
    type: "NormalizedUnicodeProperty"
}
/**
 * Code point range list
 * Character, CharacterClass and CharacterSet are converted to this.
 */
class NormalizedCharacterRanges implements NormalizedBase {
    public readonly type = "NormalizedCharacterRanges"

    public readonly raw: string

    public readonly ranges: NormalizedCharacterRange[] = []

    private static readonly DOT = new NormalizedCharacterRanges(
        [
            { min: CP_CR, max: CP_CR, type: "NormalizedRange" as const },
            { min: CP_LF, max: CP_LF, type: "NormalizedRange" as const },
            {
                min: CP_LINE_SEPARATOR,
                max: CP_PARAGRAPH_SEPARATOR,
                type: "NormalizedRange" as const,
            },
        ],
        "",
    ).negate(".")

    private static readonly D = new NormalizedCharacterRanges(
        [
            {
                min: CP_RANGE_DIGIT[0],
                max: CP_RANGE_DIGIT[1],
                type: "NormalizedRange" as const,
            },
        ],
        "\\d",
    )

    private static readonly ND = NormalizedCharacterRanges.D.negate("\\D")

    private static readonly W = new NormalizedCharacterRanges(
        [
            ...CP_RANGES_WORDS.map(([min, max]) => ({
                min,
                max,
                type: "NormalizedRange" as const,
            })),
            {
                min: CP_LOW_LINE,
                max: CP_LOW_LINE,
                type: "NormalizedRange" as const,
            },
        ],
        "\\w",
    )

    private static readonly NW = NormalizedCharacterRanges.W.negate("\\W")

    private static readonly S = new NormalizedCharacterRanges(
        [
            ...[...CPS_SINGLE_SPACES].map((num) => ({
                min: num,
                max: num,
                type: "NormalizedRange" as const,
            })),
            {
                min: CP_RANGE_SPACES[0],
                max: CP_RANGE_SPACES[1],
                type: "NormalizedRange" as const,
            },
        ],
        "\\s",
    )

    private static readonly NS = NormalizedCharacterRanges.S.negate("\\S")

    public static fromCharacterClass(
        node: CharacterClass,
    ): NormalizedCharacterRanges {
        const ranges: NormalizedCharacterRange[] = []
        for (const element of node.elements) {
            const eNode = NormalizedCharacterRanges.fromCharacterClassElement(
                element,
            )
            ranges.push(...eNode.ranges)
        }
        let result = new NormalizedCharacterRanges(ranges, node.raw)
        if (node.negate) {
            result = result.negate(node.raw)
        }
        return result
    }

    public static fromCharacterSet(
        node: CharacterSet,
    ): NormalizedCharacterRanges {
        if (node.kind === "any") {
            return NormalizedCharacterRanges.DOT
        }
        if (node.kind === "digit") {
            return node.negate
                ? NormalizedCharacterRanges.ND
                : NormalizedCharacterRanges.D
        }
        if (node.kind === "word") {
            return node.negate
                ? NormalizedCharacterRanges.NW
                : NormalizedCharacterRanges.W
        }
        if (node.kind === "space") {
            return node.negate
                ? NormalizedCharacterRanges.NS
                : NormalizedCharacterRanges.S
        }
        if (node.kind === "property") {
            return new NormalizedCharacterRanges(
                [{ node, type: "NormalizedUnicodeProperty" }],
                node.raw,
            )
        }
        throw Error(`unknown kind:${node.kind}`)
    }

    public static fromCharacterClassElement(node: CharacterClassElement) {
        if (node.type === "Character") {
            return new NormalizedCharacterRanges(
                [
                    {
                        min: node.value,
                        max: node.value,
                        type: "NormalizedRange" as const,
                    },
                ],
                node.raw,
            )
        }
        if (node.type === "CharacterClassRange") {
            return new NormalizedCharacterRanges(
                [
                    {
                        min: node.min.value,
                        max: node.max.value,
                        type: "NormalizedRange" as const,
                    },
                ],
                node.raw,
            )
        }
        return NormalizedCharacterRanges.fromCharacterSet(node)
    }

    private constructor(ranges: NormalizedCharacterRange[], raw: string) {
        this.raw = raw
        let last: NormalizedRange | null = null
        const normalizedRanges = ranges.filter(
            (range): range is NormalizedRange =>
                range.type === "NormalizedRange",
        )
        for (const range of normalizedRanges.sort(({ min: a }, { min: b }) =>
            a > b ? 1 : a < b ? -1 : 0,
        )) {
            if (last) {
                if (range.min <= last.max + 1 && last.max < range.max) {
                    last.max = range.max
                    continue
                }
            }
            last = { ...range }
            this.ranges.push(last)
        }
        this.ranges.push(
            ...ranges.filter(
                (range) => range.type === "NormalizedUnicodeProperty",
            ),
        )
    }

    public negate(newRaw: string) {
        const newRanges: NormalizedCharacterRange[] = []
        const normalizedRanges = this.ranges.filter(
            (range): range is NormalizedRange =>
                range.type === "NormalizedRange",
        )
        let start = -Infinity
        for (const range of normalizedRanges) {
            const newRange = {
                min: start,
                max: range.min - 1,
                type: "NormalizedRange" as const,
            }
            if (newRange.max === -Infinity) {
                continue
            }
            newRanges.push(newRange)
            start = range.max + 1
        }
        if (start < Infinity) {
            newRanges.push({
                min: start,
                max: Infinity,
                type: "NormalizedRange" as const,
            })
        }
        newRanges.push(
            ...this.ranges.filter(
                (range) => range.type === "NormalizedUnicodeProperty",
            ),
        )
        return new NormalizedCharacterRanges(newRanges, newRaw)
    }
}

/**
 * Normalized alternative
 * Alternative is converted to this.
 * If there is only one element of alternative, it will be skipped. e.g. /a/
 * Quantifiers with exact quantities are also converted to this. e.g. /a{3}/
 */
class NormalizedAlternative implements NormalizedBase {
    public readonly type = "NormalizedAlternative"

    public readonly raw: string

    public readonly elements: NormalizedNode[]

    public static fromNode(node: Alternative) {
        const normalizeElements: NormalizedNode[] = []
        for (const element of node.elements) {
            const normal = normalizeNode(element)
            if (normal.type === "NormalizedAlternative") {
                normalizeElements.push(...normal.elements)
            } else {
                normalizeElements.push(normal)
            }
        }
        if (normalizeElements.length === 1) {
            return normalizeElements[0]
        }
        return new NormalizedAlternative(normalizeElements, node)
    }

    public static fromQuantifier(node: Quantifier) {
        const normalizeElement = normalizeNode(node.element)
        const normalizeElements: NormalizedNode[] = []
        for (let index = 0; index < node.min; index++) {
            normalizeElements.push(normalizeElement)
        }
        if (normalizeElements.length === 1) {
            return normalizeElements[0]
        }
        return new NormalizedAlternative(normalizeElements, node)
    }

    private constructor(
        elements: NormalizedNode[],
        node: Alternative | Quantifier,
    ) {
        this.raw = node.raw
        this.elements = elements
    }
}

/**
 * Normalized disjunctions
 * CapturingGroup, Group and Pattern are converted to this.
 * If there is only one element of disjunctions, it will be skipped. e.g. /(abc)/
 */
class NormalizedDisjunctions implements NormalizedBase {
    public readonly type = "NormalizedDisjunctions"

    public readonly raw: string

    public readonly alternatives: NormalizedNode[]

    public static fromNode(node: CapturingGroup | Group | Pattern) {
        if (node.alternatives.length === 1) {
            return NormalizedAlternative.fromNode(node.alternatives[0])
        }
        return new NormalizedDisjunctions(node)
    }

    private constructor(node: CapturingGroup | Group | Pattern) {
        this.raw = node.raw
        this.alternatives = node.alternatives.map(normalizeNode)
    }
}

/**
 * Normalized lookaround assertion
 * LookaheadAssertion and LookbehindAssertion are converted to this.
 */
class NormalizedLookaroundAssertion implements NormalizedBase {
    public readonly type = "NormalizedLookaroundAssertion"

    public readonly raw: string

    public readonly node: LookaroundAssertion

    public normalizedAlternative?: NormalizedNode[]

    public static fromNode(node: LookaroundAssertion) {
        return new NormalizedLookaroundAssertion(node)
    }

    private constructor(node: LookaroundAssertion) {
        this.raw = node.raw
        this.node = node
    }

    public get alternatives() {
        return (
            this.normalizedAlternative ??
            (this.normalizedAlternative = this.node.alternatives.map(
                normalizeNode,
            ))
        )
    }

    public get kind() {
        return this.node.kind
    }

    public get negate() {
        return this.node.negate
    }
}

/**
 * Normalized Quantifier
 * Quantifier is converted to this.
 * Quantifiers with exact quantities are also converted to NormalizedAlternative. e.g. /a{3}/
 */
class NormalizedQuantifier implements NormalizedBase {
    public readonly type = "NormalizedQuantifier"

    public readonly raw: string

    private readonly node: Quantifier

    private normalizedElement?: NormalizedNode

    public static fromNode(node: Quantifier) {
        if (node.min === node.max) {
            return NormalizedAlternative.fromQuantifier(node)
        }
        return new NormalizedQuantifier(node)
    }

    private constructor(node: Quantifier) {
        this.raw = node.raw
        this.node = node
    }

    public get min() {
        return this.node.min
    }

    public get element() {
        return (
            this.normalizedElement ??
            (this.normalizedElement = normalizeNode(this.node.element))
        )
    }
}

type TargetRightNode = Exclude<
    NormalizedNode,
    NormalizedOther | NormalizedDisjunctions
>

const COVERED_CHECKER = {
    NormalizedAlternative(left: NormalizedAlternative, right: TargetRightNode) {
        if (right.type === "NormalizedAlternative") {
            if (left.elements.length <= right.elements.length) {
                // check for /ab/ : /abc/
                for (let index = 0; index < left.elements.length; index++) {
                    const le = left.elements[index]
                    const re = right.elements[index]
                    if (!isCoveredNodeImpl(le, re)) {
                        return false
                    }
                }
                return true
            }
            return false
        }
        return isCoveredAnyNode(left.elements, right)
    },
    NormalizedLookaroundAssertion(
        left: NormalizedLookaroundAssertion,
        right: TargetRightNode,
    ) {
        if (right.type === "NormalizedAlternative") {
            if (right.elements.length > 0) {
                const re = right.elements[0]
                return isCoveredNodeImpl(left, re)
            }
        }
        if (right.type === "NormalizedLookaroundAssertion") {
            if (left.kind === right.kind && !left.negate && !right.negate) {
                // check for /(?=a|b|c)/ : /(?=a|b)/
                return right.alternatives.every((r) =>
                    isCoveredAnyNode(left.alternatives, r),
                )
            }
            return isEqualNodes(left.node, right.node)
        }
        return false
    },
    NormalizedDisjunctions(
        left: NormalizedDisjunctions,
        right: TargetRightNode,
    ) {
        return isCoveredAnyNode(left.alternatives, right)
    },
    NormalizedCharacterRanges(
        left: NormalizedCharacterRanges,
        right: TargetRightNode,
    ) {
        if (right.type === "NormalizedAlternative") {
            if (right.elements.length > 0) {
                const re = right.elements[0]
                return isCoveredNodeImpl(left, re)
            }
        }
        if (right.type === "NormalizedCharacterRanges") {
            for (const rightRange of right.ranges) {
                if (rightRange.type === "NormalizedUnicodeProperty") {
                    if (
                        !left.ranges.some((leftRange) => {
                            if (
                                leftRange.type === "NormalizedUnicodeProperty"
                            ) {
                                return isEqualNodes(
                                    leftRange.node,
                                    rightRange.node,
                                )
                            }
                            return false
                        })
                    ) {
                        return false
                    }
                } else if (
                    !left.ranges.some((leftRange) => {
                        if (leftRange.type === "NormalizedUnicodeProperty") {
                            // unknown
                            return false
                        }
                        return (
                            leftRange.min <= rightRange.min &&
                            rightRange.max <= leftRange.max
                        )
                    })
                ) {
                    return false
                }
            }
            return true
        }
        return false
    },
    NormalizedQuantifier(left: NormalizedQuantifier, right: TargetRightNode) {
        if (right.type === "NormalizedAlternative") {
            if (right.elements.length > 0) {
                const re = right.elements[0]
                return isCoveredNodeImpl(left, re)
            }
        }
        if (right.type === "NormalizedQuantifier") {
            if (left.min <= right.min) {
                return isCoveredNodeImpl(left.element, right.element)
            }
        }
        if (left.min >= 1) {
            return isCoveredNodeImpl(left.element, right)
        }
        return false
    },
}

/** Checks whether the right node is covered by the left node. */
export function isCoveredNode(left: Node, right: Node): boolean {
    const leftNode = normalizeNode(left)
    const rightNode = normalizeNode(right)
    return isCoveredNodeImpl(leftNode, rightNode)
}

/** Checks whether the right node is covered by the left node. */
function isCoveredNodeImpl(
    left: NormalizedNode,
    right: NormalizedNode,
): boolean {
    if (right.type === "NormalizedDisjunctions") {
        return right.alternatives.every((r) => isCoveredNodeImpl(left, r))
    }
    if (left.type === "NormalizedOther" || right.type === "NormalizedOther") {
        if (right.type === "NormalizedAlternative") {
            if (right.elements.length > 0) {
                const re = right.elements[0]
                return isCoveredNodeImpl(left, re)
            }
        }
        if (
            left.type === "NormalizedOther" &&
            right.type === "NormalizedOther"
        ) {
            return isEqualNodes(left.node, right.node)
        }
        return false
    }
    return COVERED_CHECKER[left.type](left as never, right)
}

const cacheNormalizeNode = new WeakMap<Node, NormalizedNode>()

/** Normalize node */
function normalizeNode(node: Node): NormalizedNode {
    let n = cacheNormalizeNode.get(node)
    if (n) {
        return n
    }

    n = normalizeNodeWithoutCache(node)
    cacheNormalizeNode.set(node, n)
    return n
}

/** Normalize node without cache */
function normalizeNodeWithoutCache(node: Node): NormalizedNode {
    if (node.type === "CharacterSet") {
        return NormalizedCharacterRanges.fromCharacterSet(node)
    }
    if (node.type === "CharacterClass") {
        return NormalizedCharacterRanges.fromCharacterClass(node)
    }
    if (node.type === "Character" || node.type === "CharacterClassRange") {
        return NormalizedCharacterRanges.fromCharacterClassElement(node)
    }
    if (node.type === "Alternative") {
        return NormalizedAlternative.fromNode(node)
    }
    if (
        node.type === "CapturingGroup" ||
        node.type === "Group" ||
        node.type === "Pattern"
    ) {
        return NormalizedDisjunctions.fromNode(node)
    }
    if (node.type === "RegExpLiteral") {
        return normalizeNode(node.pattern)
    }
    if (node.type === "Assertion") {
        if (node.kind === "lookahead" || node.kind === "lookbehind") {
            return NormalizedLookaroundAssertion.fromNode(node)
        }
        return NormalizedOther.fromNode(node)
    }
    if (node.type === "Quantifier") {
        return NormalizedQuantifier.fromNode(node)
    }
    return NormalizedOther.fromNode(node)
}

/** Check whether the right node is covered by the left nodes. */
function isCoveredAnyNode(left: NormalizedNode[], right: NormalizedNode) {
    for (const e of left) {
        if (isCoveredNodeImpl(e, right)) {
            return true
        }
    }
    return false
}
