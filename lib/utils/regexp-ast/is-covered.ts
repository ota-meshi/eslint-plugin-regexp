import type {
    Alternative,
    CapturingGroup,
    Quantifier,
    Group,
    Node,
    Pattern,
    LookaroundAssertion,
} from "@eslint-community/regexpp/ast"
import { isEqualNodes } from "./is-equals"
import type { ReadonlyFlags, ToCharSetElement } from "regexp-ast-analysis"
import { toCharSet } from "regexp-ast-analysis"
import type { CharSet } from "refa"

type Options = {
    flags: ReadonlyFlags
    canOmitRight: boolean
}
interface NormalizedNodeBase {
    readonly type: string
}

type NormalizedNode =
    | NormalizedOther
    | NormalizedCharacter
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

/**
 * Code point range list
 * Character, CharacterClass and CharacterSet are converted to this.
 */
class NormalizedCharacter implements NormalizedNodeBase {
    public readonly type = "NormalizedCharacter"

    public readonly charSet: CharSet

    public static fromElement(element: ToCharSetElement, options: Options) {
        return new NormalizedCharacter(toCharSet(element, options.flags))
    }

    private constructor(charSet: CharSet) {
        this.charSet = charSet
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

    public static fromAlternative(node: Alternative, options: Options) {
        const normalizeElements = [
            ...NormalizedAlternative.normalizedElements(function* () {
                for (const element of node.elements) {
                    const normal = normalizeNode(element, options)
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

    public static fromQuantifier(node: Quantifier, options: Options) {
        const normalizeElements = [
            ...NormalizedAlternative.normalizedElements(function* () {
                const normalizeElement = normalizeNode(node.element, options)
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

    private readonly options: Options

    public normalizedAlternatives?: NormalizedAlternative[]

    public static fromNode(
        node: CapturingGroup | Group | Pattern,
        options: Options,
    ) {
        if (node.alternatives.length === 1) {
            return NormalizedAlternative.fromAlternative(
                node.alternatives[0],
                options,
            )
        }
        return new NormalizedDisjunctions(node, options)
    }

    private constructor(
        node: CapturingGroup | Group | Pattern,
        options: Options,
    ) {
        this.raw = node.raw
        this.node = node
        this.options = options
    }

    public get alternatives() {
        if (this.normalizedAlternatives) {
            return this.normalizedAlternatives
        }
        this.normalizedAlternatives = []
        for (const alt of this.node.alternatives) {
            const node = normalizeNode(alt, this.options)
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

    private readonly options: Options

    public normalizedAlternatives?: NormalizedAlternative[]

    public static fromNode(node: LookaroundAssertion, options: Options) {
        return new NormalizedLookaroundAssertion(node, options)
    }

    private constructor(node: LookaroundAssertion, options: Options) {
        this.raw = node.raw
        this.node = node
        this.options = options
    }

    public get alternatives() {
        if (this.normalizedAlternatives) {
            return this.normalizedAlternatives
        }
        this.normalizedAlternatives = []
        for (const alt of this.node.alternatives) {
            const node = normalizeNode(alt, this.options)
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

    private readonly options: Options

    private normalizedElement?: NormalizedNode

    public static fromQuantifier(node: Quantifier, options: Options) {
        let alt: NormalizedNode | null = null
        if (node.min > 0) {
            alt = NormalizedAlternative.fromQuantifier(node, options)
        }
        const max = node.max - node.min
        if (max > 0) {
            const optional = new NormalizedOptional(node, options, max)
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

    private constructor(node: Quantifier, options: Options, max: number) {
        this.raw = node.raw
        this.max = max
        this.node = node
        this.options = options
    }

    public get element() {
        return (
            this.normalizedElement ??
            (this.normalizedElement = normalizeNode(
                this.node.element,
                this.options,
            ))
        )
    }

    public decrementMax(dec = 1): NormalizedOptional | null {
        if (this.max <= dec) {
            return null
        }
        if (this.max === Infinity) {
            return this
        }
        const opt = new NormalizedOptional(
            this.node,
            this.options,
            this.max - dec,
        )
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
    const leftNode = normalizeNode(left, options)
    const rightNode = normalizeNode(right, options)
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
            return isEqualNodes(left.node, right.node, options.flags)
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
            return isEqualNodes(left.node, right.node, options.flags)
        }
        return false
    }

    // NormalizedCharacter
    if (right.type === "NormalizedCharacter") {
        return right.charSet.isSubsetOf(left.charSet)
    }
    return false
}

const cacheNormalizeNode = new WeakMap<Node, NormalizedNode>()

/** Normalize node */
function normalizeNode(node: Node, options: Options): NormalizedNode {
    let n = cacheNormalizeNode.get(node)
    if (n) {
        return n
    }

    n = normalizeNodeWithoutCache(node, options)
    cacheNormalizeNode.set(node, n)
    return n
}

/** Normalize node without cache */
function normalizeNodeWithoutCache(
    node: Node,
    options: Options,
): NormalizedNode {
    if (
        node.type === "CharacterSet" ||
        node.type === "CharacterClass" ||
        node.type === "Character" ||
        node.type === "CharacterClassRange"
    ) {
        // FIXME: TS Error
        // @ts-expect-error -- FIXME
        return NormalizedCharacter.fromElement(node, options)
    }
    if (node.type === "Alternative") {
        return NormalizedAlternative.fromAlternative(node, options)
    }
    if (node.type === "Quantifier") {
        return NormalizedOptional.fromQuantifier(node, options)
    }
    if (
        node.type === "CapturingGroup" ||
        node.type === "Group" ||
        node.type === "Pattern"
    ) {
        return NormalizedDisjunctions.fromNode(node, options)
    }
    if (node.type === "RegExpLiteral") {
        return normalizeNode(node.pattern, options)
    }
    if (node.type === "Assertion") {
        if (node.kind === "lookahead" || node.kind === "lookbehind") {
            return NormalizedLookaroundAssertion.fromNode(node, options)
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

/* eslint-disable complexity -- X( */
/** Check whether the right nodes is covered by the left nodes. */
function isCoveredAltNodes(
    /* eslint-enable complexity -- X( */
    leftNodes: NormalizedNode[],
    rightNodes: NormalizedNode[],
    options: Options,
): boolean {
    const left = options.canOmitRight ? omitEnds(leftNodes) : [...leftNodes]
    const right = options.canOmitRight ? omitEnds(rightNodes) : [...rightNodes]
    while (left.length && right.length) {
        const le = left.shift()!
        const re = right.shift()!

        if (re.type === "NormalizedOptional") {
            if (le.type === "NormalizedOptional") {
                // Check for elements
                if (
                    !isCoveredForNormalizedNode(le.element, re.element, options)
                ) {
                    return false
                }
                // Check for next
                const decrementLe = le.decrementMax(re.max)
                if (decrementLe) {
                    return isCoveredAltNodes(
                        [decrementLe, ...left],
                        right,
                        options,
                    )
                }
                const decrementRe = re.decrementMax(le.max)
                if (decrementRe) {
                    return isCoveredAltNodes(
                        left,
                        [decrementRe, ...right],
                        options,
                    )
                }
            } else {
                // Check for elements
                if (!isCoveredForNormalizedNode(le, re.element, options)) {
                    return false
                }
                // Checks if skipped.
                if (!isCoveredAltNodes([le, ...left], right, options)) {
                    return false
                }
                const decrementRe = re.decrementMax()
                if (decrementRe) {
                    // Check for multiple iterations.
                    return isCoveredAltNodes(
                        left,
                        [decrementRe, ...right],
                        options,
                    )
                }
            }
        } else if (le.type === "NormalizedOptional") {
            // Checks if skipped.
            if (isCoveredAltNodes(left, [re, ...right], options)) {
                return true
            }
            if (!isCoveredForNormalizedNode(le.element, re, options)) {
                // I know it won't match if I skip it.
                return false
            }
            const decrementLe = le.decrementMax()
            if (decrementLe) {
                // Check for multiple iterations.
                if (isCoveredAltNodes([decrementLe, ...left], right, options)) {
                    return true
                }
            }
        } else if (!isCoveredForNormalizedNode(le, re, options)) {
            return false
        }
    }
    if (!options.canOmitRight) {
        if (right.length) {
            return false
        }
    }
    return !left.length
}

/**
 * Exclude the end optionals.
 */
function omitEnds(nodes: NormalizedNode[]): NormalizedNode[] {
    for (let index = nodes.length - 1; index >= 0; index--) {
        const node = nodes[index]
        if (node.type !== "NormalizedOptional") {
            return nodes.slice(0, index + 1)
        }
    }
    return []
}
