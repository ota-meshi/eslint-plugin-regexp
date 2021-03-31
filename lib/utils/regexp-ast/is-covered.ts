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
    CP_RANGE_CAPITAL_LETTER,
    CP_RANGE_DIGIT,
    CP_RANGE_SMALL_LETTER,
    CP_RANGE_SPACES,
    toLowerCodePoint,
    toUpperCodePoint,
} from "../unicode"

type Options = {
    flags: {
        left: string
        right: string
    }
}
interface NormalizedNodeBase {
    readonly type: string
}

type NormalizedNode =
    | NormalizedOther
    | NormalizedCharacterRanges
    | NormalizedDisjunctions
    | NormalizedAlternative
    | NormalizedLookaroundAssertion
    | NormalizedOptional
class NormalizedOther implements NormalizedNodeBase {
    public readonly type = "NormalizedOther"

    public readonly node: Node

    public static fromNode(node: Node) {
        return new NormalizedOther(node)
    }

    private constructor(node: Node) {
        this.node = node
    }
}
interface NormalizedCharacterRangeBase {
    readonly type: string

    isCovered(right: NormalizedCharacterRange): boolean
}

type NormalizedCharacterRange =
    | NormalizedRange
    | NormalizedUnicodeProperty
    | NormalizedUnknownRange
/**
 * Code point range
 * Character, CharacterClassRange and CharacterSet are converted to this.
 */
class NormalizedRange implements NormalizedCharacterRangeBase {
    public readonly type = "NormalizedRange"

    public readonly min: number

    public max: number

    public constructor(min: number, max?: number) {
        this.min = min
        this.max = max ?? min
    }

    public isCovered(right: NormalizedCharacterRange) {
        if (right.type === "NormalizedRange") {
            return this.min <= right.min && right.max <= this.max
        }
        // dotAll covers everything.
        return this.min === -Infinity && this.max === Infinity
    }
}
/**
 * UnicodeProperty
 * UnicodePropertyCharacterSet is converted to this.
 */
class NormalizedUnicodeProperty implements NormalizedCharacterRangeBase {
    public readonly type = "NormalizedUnicodeProperty"

    private readonly text: string

    private readonly negateFlag: boolean

    public constructor(text: string, negate: boolean) {
        this.text = text
        this.negateFlag = negate
    }

    public get patternText() {
        if (this.negateFlag) {
            return `\\P${this.text}`
        }
        return `\\p${this.text}`
    }

    public negate() {
        return new NormalizedUnicodeProperty(this.text, !this.negateFlag)
    }

    public isCovered(right: NormalizedCharacterRange) {
        if (right.type === "NormalizedUnicodeProperty") {
            return this.patternText === right.patternText
        }
        return false
    }
}
/**
 * Unknown range
 */
class NormalizedUnknownRange implements NormalizedCharacterRangeBase {
    public readonly type = "NormalizedUnknownRange"

    public isCovered(_right: NormalizedCharacterRange) {
        return false
    }
}
/**
 * Code point range list
 * Character, CharacterClass and CharacterSet are converted to this.
 */
class NormalizedCharacterRanges implements NormalizedNodeBase {
    public readonly type = "NormalizedCharacterRanges"

    public readonly raw: string

    public readonly ranges: NormalizedCharacterRange[] = []

    private static readonly ALL = new NormalizedCharacterRanges(
        [new NormalizedRange(-Infinity, Infinity)],
        ".",
    )

    private static readonly DOT = new NormalizedCharacterRanges(
        [
            new NormalizedRange(CP_CR),
            new NormalizedRange(CP_LF),
            new NormalizedRange(CP_LINE_SEPARATOR, CP_PARAGRAPH_SEPARATOR),
        ],
        "",
    ).negate(".")

    private static readonly D = new NormalizedCharacterRanges(
        [new NormalizedRange(...CP_RANGE_DIGIT)],
        "\\d",
    )

    private static readonly ND = NormalizedCharacterRanges.D.negate("\\D")

    private static readonly W = new NormalizedCharacterRanges(
        [
            ...CP_RANGES_WORDS.map(
                ([min, max]) => new NormalizedRange(min, max),
            ),
            new NormalizedRange(CP_LOW_LINE),
        ],
        "\\w",
    )

    private static readonly NW = NormalizedCharacterRanges.W.negate("\\W")

    private static readonly S = new NormalizedCharacterRanges(
        [
            ...[...CPS_SINGLE_SPACES].map((num) => new NormalizedRange(num)),
            new NormalizedRange(...CP_RANGE_SPACES),
        ],
        "\\s",
    )

    private static readonly NS = NormalizedCharacterRanges.S.negate("\\S")

    public static fromCharacterClass(
        node: CharacterClass,
        flags: string,
    ): NormalizedCharacterRanges {
        const ranges: NormalizedCharacterRange[] = []
        for (const element of node.elements) {
            const eNode = NormalizedCharacterRanges.fromCharacterClassElement(
                element,
                flags,
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
        flags: string,
    ): NormalizedCharacterRanges {
        if (node.kind === "any") {
            return flags.includes("s")
                ? NormalizedCharacterRanges.ALL
                : NormalizedCharacterRanges.DOT
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
                [new NormalizedUnicodeProperty(node.raw.slice(2), node.negate)],
                node.raw,
            )
        }
        throw Error(`unknown kind:${node.kind}`)
    }

    public static fromCharacterClassElement(
        node: CharacterClassElement,
        flags: string,
    ) {
        if (node.type === "Character" || node.type === "CharacterClassRange") {
            let baseRange: NormalizedRange
            if (node.type === "Character") {
                baseRange = new NormalizedRange(node.value)
            } else {
                baseRange = new NormalizedRange(node.min.value, node.max.value)
            }
            const ranges: NormalizedRange[] = [baseRange]

            if (flags.includes("i")) {
                const capitalIntersection = getIntersection(
                    CP_RANGE_CAPITAL_LETTER,
                    [baseRange.min, baseRange.max],
                )
                if (capitalIntersection) {
                    ranges.push(
                        new NormalizedRange(
                            toLowerCodePoint(capitalIntersection[0]),
                            toLowerCodePoint(capitalIntersection[1]),
                        ),
                    )
                }
                const smallIntersection = getIntersection(
                    CP_RANGE_SMALL_LETTER,
                    [baseRange.min, baseRange.max],
                )
                if (smallIntersection) {
                    ranges.push(
                        new NormalizedRange(
                            toUpperCodePoint(smallIntersection[0]),
                            toUpperCodePoint(smallIntersection[1]),
                        ),
                    )
                }
            }
            return new NormalizedCharacterRanges(ranges, node.raw)
        }
        return NormalizedCharacterRanges.fromCharacterSet(node, flags)

        /**
         * Gets the two given range intersection.
         * @param a The first range.
         * @param b The second range.
         * @returns the two given range intersection.
         */
        function getIntersection(
            a: readonly [number, number],
            b: readonly [number, number],
        ): [number, number] | null {
            if (b[1] < a[0] || a[1] < b[0]) {
                return null
            }

            return [Math.max(a[0], b[0]), Math.min(a[1], b[1])]
        }
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
            last = new NormalizedRange(range.min, range.max)
            this.ranges.push(last)
        }
        this.ranges.push(
            ...ranges.filter((range) => range.type !== "NormalizedRange"),
        )
    }

    public negate(newRaw: string) {
        if (this.ranges.length === 1) {
            const range = this.ranges[0]
            if (range.type === "NormalizedUnicodeProperty") {
                return new NormalizedCharacterRanges([range.negate()], newRaw)
            }
        }
        const newRanges: NormalizedCharacterRange[] = []
        const normalizedRanges = this.ranges.filter(
            (range): range is NormalizedRange =>
                range.type === "NormalizedRange",
        )
        let start = -Infinity
        for (const range of normalizedRanges) {
            const newRange = new NormalizedRange(start, range.min - 1)
            if (newRange.max === -Infinity) {
                continue
            }
            newRanges.push(newRange)
            start = range.max + 1
        }
        if (start < Infinity) {
            newRanges.push(new NormalizedRange(start, Infinity))
        }
        if (this.ranges.some((range) => range.type !== "NormalizedRange")) {
            newRanges.push(new NormalizedUnknownRange())
        }
        return new NormalizedCharacterRanges(newRanges, newRaw)
    }
}

/**
 * Normalized alternative
 * Alternative and Quantifier are converted to this.
 * If there is only one element of alternative, it will be skipped. e.g. /a/
 */
class NormalizedAlternative implements NormalizedNodeBase {
    public readonly type = "NormalizedAlternative"

    public readonly raw: string

    public readonly elements: NormalizedNode[]

    public static fromAlternative(node: Alternative, flags: string) {
        const normalizeElements = [
            ...NormalizedAlternative.normalizedElements(function* () {
                for (const element of node.elements) {
                    const normal = normalizeNode(element, flags)
                    if (normal.type === "NormalizedAlternative") {
                        yield* normal.elements
                    } else {
                        yield normal
                    }
                }
            }),
        ]
        if (normalizeElements.length === 1) {
            return normalizeElements[0]
        }
        return new NormalizedAlternative(normalizeElements, node)
    }

    public static fromQuantifier(node: Quantifier, flags: string) {
        const normalizeElements = [
            ...NormalizedAlternative.normalizedElements(function* () {
                const normalizeElement = normalizeNode(node.element, flags)
                for (let index = 0; index < node.min; index++) {
                    yield normalizeElement
                }
            }),
        ]
        if (normalizeElements.length === 1) {
            return normalizeElements[0]
        }
        return new NormalizedAlternative(normalizeElements, node)
    }

    public static fromElements(
        elements: NormalizedNode[],
        node: Alternative | Quantifier,
    ) {
        const normalizeElements = [
            ...NormalizedAlternative.normalizedElements(function* () {
                yield* elements
            }),
        ]
        return new NormalizedAlternative(normalizeElements, node)
    }

    private static *normalizedElements(
        generate: () => Generator<NormalizedNode>,
    ): IterableIterator<NormalizedNode> {
        for (const node of generate()) {
            if (node.type === "NormalizedAlternative") {
                yield* node.elements
            } else {
                yield node
            }
        }
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
class NormalizedDisjunctions implements NormalizedNodeBase {
    public readonly type = "NormalizedDisjunctions"

    public readonly raw: string

    public readonly node: CapturingGroup | Group | Pattern

    private readonly flags: string

    public normalizedAlternatives?: NormalizedAlternative[]

    public static fromNode(
        node: CapturingGroup | Group | Pattern,
        flags: string,
    ) {
        if (node.alternatives.length === 1) {
            return NormalizedAlternative.fromAlternative(
                node.alternatives[0],
                flags,
            )
        }
        return new NormalizedDisjunctions(node, flags)
    }

    private constructor(node: CapturingGroup | Group | Pattern, flags: string) {
        this.raw = node.raw
        this.node = node
        this.flags = flags
    }

    public get alternatives() {
        if (this.normalizedAlternatives) {
            return this.normalizedAlternatives
        }
        this.normalizedAlternatives = []
        for (const alt of this.node.alternatives) {
            const node = normalizeNode(alt, this.flags)
            if (node.type === "NormalizedAlternative") {
                this.normalizedAlternatives.push(node)
            } else {
                this.normalizedAlternatives.push(
                    NormalizedAlternative.fromElements([node], alt),
                )
            }
        }
        return this.normalizedAlternatives
    }
}

/**
 * Normalized lookaround assertion
 * LookaheadAssertion and LookbehindAssertion are converted to this.
 */
class NormalizedLookaroundAssertion implements NormalizedNodeBase {
    public readonly type = "NormalizedLookaroundAssertion"

    public readonly raw: string

    public readonly node: LookaroundAssertion

    private readonly flags: string

    public normalizedAlternatives?: NormalizedAlternative[]

    public static fromNode(node: LookaroundAssertion, flags: string) {
        return new NormalizedLookaroundAssertion(node, flags)
    }

    private constructor(node: LookaroundAssertion, flags: string) {
        this.raw = node.raw
        this.node = node
        this.flags = flags
    }

    public get alternatives() {
        if (this.normalizedAlternatives) {
            return this.normalizedAlternatives
        }
        this.normalizedAlternatives = []
        for (const alt of this.node.alternatives) {
            const node = normalizeNode(alt, this.flags)
            if (node.type === "NormalizedAlternative") {
                this.normalizedAlternatives.push(node)
            } else {
                this.normalizedAlternatives.push(
                    NormalizedAlternative.fromElements([node], alt),
                )
            }
        }
        return this.normalizedAlternatives
    }

    public get kind() {
        return this.node.kind
    }

    public get negate() {
        return this.node.negate
    }
}

/**
 * Normalized optional node
 * Quantifier is converted to this.
 * The exactly quantifier of the number will be converted to NormalizedAlternative.
 */
class NormalizedOptional implements NormalizedNodeBase {
    public readonly type = "NormalizedOptional"

    public readonly raw: string

    public readonly max: number

    public readonly node: Quantifier

    private readonly flags: string

    private normalizedElement?: NormalizedNode

    public static fromQuantifier(node: Quantifier, flags: string) {
        let alt: NormalizedNode | null = null
        if (node.min > 0) {
            alt = NormalizedAlternative.fromQuantifier(node, flags)
        }
        const max = node.max - node.min
        if (max > 0) {
            const optional = new NormalizedOptional(node, flags, max)
            if (alt) {
                if (alt.type === "NormalizedAlternative") {
                    return NormalizedAlternative.fromElements(
                        [...alt.elements, optional],
                        node,
                    )
                }
                return NormalizedAlternative.fromElements([alt, optional], node)
            }
            return optional
        }
        if (alt) {
            return alt
        }
        return NormalizedOther.fromNode(node)
    }

    private constructor(node: Quantifier, flags: string, max: number) {
        this.raw = node.raw
        this.max = max
        this.node = node
        this.flags = flags
    }

    public get element() {
        return (
            this.normalizedElement ??
            (this.normalizedElement = normalizeNode(
                this.node.element,
                this.flags,
            ))
        )
    }

    public decrementMax() {
        if (this.max === Infinity) {
            return this
        }
        const opt = new NormalizedOptional(this.node, this.flags, this.max - 1)
        opt.normalizedElement = this.normalizedElement
        return opt
    }
}

/** Checks whether the right node is covered by the left node. */
export function isCoveredNode(
    left: Node,
    right: Node,
    options: Options,
): boolean {
    const leftNode = normalizeNode(left, options.flags.left)
    const rightNode = normalizeNode(right, options.flags.right)
    return isCoveredForNormalizedNode(leftNode, rightNode, options)
}

/* eslint-disable complexity -- X( */
/** Checks whether the right node is covered by the left node. */
function isCoveredForNormalizedNode(
    /* eslint-enable complexity -- X( */
    left: NormalizedNode,
    right: NormalizedNode,
    options: Options,
): boolean {
    // Disjunctions
    if (right.type === "NormalizedDisjunctions") {
        // If any is covered, the disjunctions on the right is covered.
        return right.alternatives.every((r) =>
            isCoveredForNormalizedNode(left, r, options),
        )
    }
    if (left.type === "NormalizedDisjunctions") {
        return isCoveredAnyNode(left.alternatives, right, options)
    }

    // Alternative
    if (left.type === "NormalizedAlternative") {
        if (right.type === "NormalizedAlternative") {
            return isCoveredAltNodes(left.elements, right.elements, options)
        }
        return isCoveredAltNodes(left.elements, [right], options)
    } else if (right.type === "NormalizedAlternative") {
        return isCoveredAltNodes([left], right.elements, options)
    }

    // Optional
    if (
        left.type === "NormalizedOptional" ||
        right.type === "NormalizedOptional"
    ) {
        return isCoveredAltNodes([left], [right], options)
    }

    // Other
    if (left.type === "NormalizedOther" || right.type === "NormalizedOther") {
        if (
            left.type === "NormalizedOther" &&
            right.type === "NormalizedOther"
        ) {
            return isEqualNodes(left.node, right.node)
        }
        return false
    }

    // NormalizedLookaroundAssertion
    if (
        left.type === "NormalizedLookaroundAssertion" ||
        right.type === "NormalizedLookaroundAssertion"
    ) {
        if (
            left.type === "NormalizedLookaroundAssertion" &&
            right.type === "NormalizedLookaroundAssertion"
        ) {
            if (left.kind === right.kind && !left.negate && !right.negate) {
                // check for /(?=a|b|c)/ : /(?=a|b)/
                return right.alternatives.every((r) =>
                    isCoveredAnyNode(left.alternatives, r, options),
                )
            }
            return isEqualNodes(left.node, right.node)
        }
        return false
    }

    // NormalizedCharacterRanges
    if (right.type === "NormalizedCharacterRanges") {
        for (const rightRange of right.ranges) {
            if (
                !left.ranges.some((leftRange) => {
                    return leftRange.isCovered(rightRange)
                })
            ) {
                return false
            }
        }
        return true
    }
    return false
}

const cacheNormalizeNode = new WeakMap<Node, NormalizedNode>()

/** Normalize node */
function normalizeNode(node: Node, flags: string): NormalizedNode {
    let n = cacheNormalizeNode.get(node)
    if (n) {
        return n
    }

    n = normalizeNodeWithoutCache(node, flags)
    cacheNormalizeNode.set(node, n)
    return n
}

/** Normalize node without cache */
function normalizeNodeWithoutCache(node: Node, flags: string): NormalizedNode {
    if (node.type === "CharacterSet") {
        return NormalizedCharacterRanges.fromCharacterSet(node, flags)
    }
    if (node.type === "CharacterClass") {
        return NormalizedCharacterRanges.fromCharacterClass(node, flags)
    }
    if (node.type === "Character" || node.type === "CharacterClassRange") {
        return NormalizedCharacterRanges.fromCharacterClassElement(node, flags)
    }
    if (node.type === "Alternative") {
        return NormalizedAlternative.fromAlternative(node, flags)
    }
    if (node.type === "Quantifier") {
        return NormalizedOptional.fromQuantifier(node, flags)
    }
    if (
        node.type === "CapturingGroup" ||
        node.type === "Group" ||
        node.type === "Pattern"
    ) {
        return NormalizedDisjunctions.fromNode(node, flags)
    }
    if (node.type === "RegExpLiteral") {
        return normalizeNode(node.pattern, flags)
    }
    if (node.type === "Assertion") {
        if (node.kind === "lookahead" || node.kind === "lookbehind") {
            return NormalizedLookaroundAssertion.fromNode(node, flags)
        }
        return NormalizedOther.fromNode(node)
    }
    return NormalizedOther.fromNode(node)
}

/** Check whether the right node is covered by the left nodes. */
function isCoveredAnyNode(
    left: NormalizedNode[],
    right: NormalizedNode,
    options: Options,
) {
    for (const e of left) {
        if (isCoveredForNormalizedNode(e, right, options)) {
            return true
        }
    }
    return false
}

/** Check whether the right nodes is covered by the left nodes. */
function isCoveredAltNodes(
    left: NormalizedNode[],
    right: NormalizedNode[],
    options: Options,
) {
    let leftIndex = 0
    let rightIndex = 0
    while (leftIndex < left.length && rightIndex < right.length) {
        const le = left[leftIndex]
        const re = right[rightIndex]

        if (re.type === "NormalizedOptional") {
            rightIndex++
            continue
        } else if (le.type === "NormalizedOptional") {
            // Checks if skipped.
            const skippedLeftItems = left.slice(leftIndex + 1)
            if (
                isCoveredAltNodes(
                    skippedLeftItems,
                    right.slice(rightIndex),
                    options,
                )
            ) {
                return true
            }
            if (!isCoveredForNormalizedNode(le.element, re, options)) {
                // I know it won't match if I skip it.
                return false
            }
            if (le.max >= 2) {
                // Check for multiple iterations.
                if (
                    isCoveredAltNodes(
                        [le.decrementMax(), ...skippedLeftItems],
                        right.slice(rightIndex + 1),
                        options,
                    )
                ) {
                    return true
                }
            }
        } else if (!isCoveredForNormalizedNode(le, re, options)) {
            return false
        }
        leftIndex++
        rightIndex++
    }
    while (leftIndex < left.length) {
        const le = left[leftIndex]
        if (le.type !== "NormalizedOptional") {
            return false
        }
        leftIndex++
    }
    return leftIndex >= left.length
}
