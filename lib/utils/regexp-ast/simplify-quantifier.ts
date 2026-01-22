import type {
    Alternative,
    Element,
    Node,
    QuantifiableElement,
    Quantifier,
} from "@eslint-community/regexpp/ast"
import type { JS } from "refa"
import { DFA, NFA } from "refa"
import type { MatchingDirection, ReadonlyFlags } from "regexp-ast-analysis"
import {
    getMatchingDirection,
    isEmpty,
    hasSomeDescendant,
    isZeroLength,
    isPotentiallyZeroLength,
    getConsumedChars,
} from "regexp-ast-analysis"
import { assertNever, cachedFn, reversed } from "../util.ts"

/** Returns whether the given node contains any assertions. */
const containsAssertions = cachedFn((node: Node) => {
    return hasSomeDescendant(node, (n) => n.type === "Assertion")
})
/** A cached (and curried) version of {@link getConsumedChars}. */
const cachedGetPossiblyConsumedChar = cachedFn((flags: ReadonlyFlags) => {
    return cachedFn((element: Element) => getConsumedChars(element, flags))
})

export type CanSimplify = {
    readonly canSimplify: true
    readonly dependencies: Quantifier[]
}
export type CannotSimplify = { readonly canSimplify: false }
export type SimplifyResult = CanSimplify | CannotSimplify

const CANNOT_SIMPLIFY: CannotSimplify = { canSimplify: false }

/**
 * Returns whether a quantifier `A{n,m}` can be simplified to `A{n}` where `n<m`.
 */
export function canSimplifyQuantifier(
    quantifier: Quantifier,
    flags: ReadonlyFlags,
    parser: JS.Parser,
): SimplifyResult {
    if (quantifier.min === quantifier.max) {
        return CANNOT_SIMPLIFY
    }
    if (isZeroLength(quantifier, flags)) {
        return CANNOT_SIMPLIFY
    }
    if (containsAssertions(quantifier)) {
        // no method can handle assertions
        return CANNOT_SIMPLIFY
    }

    // find the full set of quantifiers that precede this one
    const direction = getMatchingDirection(quantifier)
    const preceding = getPrecedingQuantifiers(quantifier, direction, flags)
    if (!preceding) {
        // there is something that is not a quantifier
        return CANNOT_SIMPLIFY
    }

    return canAbsorb(preceding, { direction, flags, parser, quantifier })
}

interface AbsorbOptions {
    readonly quantifier: Quantifier
    readonly direction: MatchingDirection
    readonly flags: ReadonlyFlags
    readonly parser: JS.Parser
}

/**
 * Returns whether all of the given quantifiers can fully absorb the given
 * quantifier.
 */
function canAbsorb(
    initialPreceding: readonly Quantifier[],
    options: AbsorbOptions,
): SimplifyResult {
    const { direction, flags, parser, quantifier } = options

    const preceding = removeTargetQuantifier(
        initialPreceding,
        quantifier,
        direction,
        flags,
    )
    if (!preceding) {
        return CANNOT_SIMPLIFY
    }

    const dependencies = [...preceding]
    const CAN_SIMPLIFY: SimplifyResult = {
        canSimplify: true,
        dependencies,
    }

    const fast = everyMaybe(preceding, (q) =>
        canAbsorbElementFast(q, quantifier.element, flags),
    )
    if (typeof fast === "boolean") {
        return fast ? CAN_SIMPLIFY : CANNOT_SIMPLIFY
    }

    const formal = everyMaybe(fast, (q) =>
        canAbsorbElementFormal(q, quantifier.element, parser),
    )
    if (typeof formal === "boolean") {
        return formal ? CAN_SIMPLIFY : CANNOT_SIMPLIFY
    }

    return formal.every((q) => {
        // try splitting the quantifier
        const parts = splitQuantifierIntoTails(q, direction, flags)
        if (!parts) return false
        const result = canAbsorb(parts, options)
        if (result.canSimplify) dependencies.push(...result.dependencies)
        return result.canSimplify
    })
        ? CAN_SIMPLIFY
        : CANNOT_SIMPLIFY
}

/**
 * A maybe bool version `Array.every`. If at least one item maps to `false`,
 * `false` will be returned. If all items map to `true`, `true` will be
 * returned. Otherwise, all items that map to maybe will be returned.
 */
function everyMaybe<T>(
    array: Iterable<T>,
    fn: (item: T) => MaybeBool,
): boolean | [T, ...T[]] {
    const maybe: T[] = []
    for (const item of array) {
        const result = fn(item)
        if (result === false) return false
        if (result === undefined) maybe.push(item)
    }
    if (maybe.length === 0) return true
    return maybe as [T, ...T[]]
}

type MaybeBool = boolean | undefined

/**
 * Returns whether `Q = QE*`.
 *
 * This is implemented using a fast method based on single-character quantifiers.
 */
function canAbsorbElementFast(
    quantifier: Quantifier,
    element: QuantifiableElement,
    flags: ReadonlyFlags,
): MaybeBool {
    if (!quantifier.greedy) {
        // we generally say that lazy quantifiers don't absorb `E*`
        return false
    }

    if (!isNonFinite(quantifier, flags)) {
        // to absorb `E*`, the `Q` needs to be non-finite language
        return false
    }

    const qChar = cachedGetPossiblyConsumedChar(flags)(quantifier.element)
    const eChar = cachedGetPossiblyConsumedChar(flags)(element)

    if (qChar.chars.isDisjointWith(eChar.chars)) {
        // Since `Q` and `E` are disjoint, there is no way for `Q` to absorb `E*`
        return false
    }

    if (eChar.exact && !eChar.chars.without(qChar.chars).isEmpty) {
        // At least one char in `E` cannot be absorbed by `Q`
        return false
    }

    if (containsAssertions(quantifier) || containsAssertions(element)) {
        // we cannot check this right now
        return undefined
    }

    if (
        quantifier.element.type === "Character" ||
        quantifier.element.type === "CharacterClass" ||
        quantifier.element.type === "CharacterSet"
    ) {
        if (quantifier.max !== Infinity) {
            // This check is redundant because of the star check above,
            // but it makes the reasoning more local.
            return false
        }

        if (qChar.exact && qChar.chars.isSupersetOf(eChar.chars)) {
            return true
        }
    }

    return undefined
}

/** Returns whether the given node accepts a non-finite language. */
function isNonFinite(node: Node, flags: ReadonlyFlags): boolean {
    return hasSomeDescendant(
        node,
        (n) =>
            n.type === "Quantifier" &&
            n.max === Infinity &&
            !isZeroLength(n.element, flags),
        // don't decent into assertions
        (n) => n.type !== "Assertion",
    )
}

/** Returns the NFA for the given element. */
function toNfa(element: Element, parser: JS.Parser): NFA {
    const { expression, maxCharacter } = parser.parseElement(element, {
        maxNodes: 1000,
        assertions: "throw",
        backreferences: "throw",
    })
    return NFA.fromRegex(
        expression,
        { maxCharacter },
        {},
        new NFA.LimitedNodeFactory(1000),
    )
}

/**
 * Returns whether `Q = QE*`.
 *
 * This is implemented using a slow NFA/DFA based method.
 */
function canAbsorbElementFormal(
    quantifier: Quantifier,
    element: QuantifiableElement,
    parser: JS.Parser,
): MaybeBool {
    if (containsAssertions(quantifier) || containsAssertions(element)) {
        // we cannot check this right now
        return undefined
    }

    try {
        // perform a full NFA/DFA language check
        const qNfa = toNfa(quantifier, parser)
        const qDfa = DFA.fromFA(qNfa, new DFA.LimitedNodeFactory(1000))
        const eNfa = toNfa(element, parser)
        // We want to check whether `QE* = Q`. To perform this check, it's
        // sufficient to check `QE? = Q`. Proof sketch:
        // 1. If `QE? = Q`, then `Q = QE? = (QE?)E? = (QE?E?)E? = ... = QE*`.
        // 2. If `QE? != Q`, then `Q ⊂ QE? ⊆ QE*`, so `QE* != Q`.
        eNfa.quantify(0, 1)
        qNfa.append(eNfa)
        const qeDfa = DFA.fromFA(qNfa, new DFA.LimitedNodeFactory(1000))

        qDfa.minimize()
        qeDfa.minimize()
        const equal = qDfa.structurallyEqual(qeDfa)
        return equal
    } catch {
        // ignore errors
    }

    return undefined
}

/**
 * Returns all quantifiers that precede a hypothetical element after the given quantifier.
 */
function splitQuantifierIntoTails(
    quantifier: Quantifier,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): Quantifier[] | undefined {
    if (isPotentiallyZeroLength(quantifier, flags)) {
        return undefined
    }
    return getTailQuantifiers(quantifier.element, direction, flags)
}

/**
 * Removes the given target quantifier from the list of quantifiers. This is
 * done by replacing quantifiers that contain the target quantifier with their
 * tail quantifiers.
 *
 * The returned quantifiers are guaranteed to not contain the target.
 */
function removeTargetQuantifier(
    quantifiers: readonly Quantifier[],
    target: Element,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): Quantifier[] | undefined {
    const result: Quantifier[] = []

    for (const q of quantifiers) {
        if (hasSomeDescendant(q, target)) {
            const inner = splitQuantifierIntoTails(q, direction, flags)
            if (inner === undefined) {
                return undefined
            }
            const mapped = removeTargetQuantifier(
                inner,
                target,
                direction,
                flags,
            )
            if (mapped === undefined) {
                return undefined
            }
            result.push(...mapped)
        } else {
            result.push(q)
        }
    }

    return result
}

type QuantifierSet = [Quantifier, ...Quantifier[]] | undefined

/** Unions the given quantifier sets. */
function unionQuantifiers(sets: Iterable<QuantifierSet>): QuantifierSet {
    const result: Quantifier[] = []
    for (const set of sets) {
        if (set === undefined) {
            return undefined
        }
        result.push(...set)
    }
    if (result.length === 0) return undefined
    return [...new Set(result)] as [Quantifier, ...Quantifier[]]
}

/**
 * Returns all quantifier that are guaranteed to always be at the end of the given element.
 */
function getTailQuantifiers(
    element: Element | Alternative,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): [Quantifier, ...Quantifier[]] | undefined {
    switch (element.type) {
        case "Assertion":
        case "Backreference":
        case "Character":
        case "CharacterClass":
        case "CharacterSet":
        case "ExpressionCharacterClass":
            return undefined

        case "Quantifier":
            return [element]

        case "Group":
        case "CapturingGroup":
            return unionQuantifiers(
                element.alternatives.map((a) =>
                    getTailQuantifiers(a, direction, flags),
                ),
            )

        case "Alternative": {
            const elements =
                direction === "ltr"
                    ? reversed(element.elements)
                    : element.elements
            for (const e of elements) {
                // skip empty elements
                if (isEmpty(e, flags)) continue

                if (e.type === "Quantifier") {
                    return [e]
                }
                return undefined
            }

            const { parent } = element
            if (parent.type === "Pattern") {
                return undefined
            }
            if (parent.type === "Assertion") {
                // TODO: Assertions aren't supported for now.
                return undefined
            }
            return getPrecedingQuantifiers(parent, direction, flags)
        }

        default:
            return assertNever(element)
    }
}

/**
 * Returns the quantifier always directly preceding the given element, if any.
 */
function getPrecedingQuantifiers(
    element: Element,
    direction: MatchingDirection,
    flags: ReadonlyFlags,
): [Quantifier, ...Quantifier[]] | undefined {
    const parent = element.parent
    if (parent.type === "Quantifier") {
        if (parent.max === 0) {
            // we never actually enter the element, so there cannot be quantifiers before it
            return undefined
        }
        if (parent.max === 1) {
            // the quantifier is essentially equivalent to a simple group
            return getPrecedingQuantifiers(parent, direction, flags)
        }

        // Both the elements preceding the quantifier as well as the quantifier itself have to be considered
        return unionQuantifiers([
            getPrecedingQuantifiers(parent, direction, flags),
            getTailQuantifiers(parent.element, direction, flags),
        ])
    }
    if (parent.type !== "Alternative") {
        return undefined
    }

    const inc = direction === "ltr" ? -1 : +1
    const { elements } = parent
    const elementIndex = elements.indexOf(element)
    for (
        let precedingIndex = elementIndex + inc;
        precedingIndex >= 0 && precedingIndex < elements.length;
        precedingIndex += inc
    ) {
        const preceding = parent.elements[precedingIndex]

        // skip empty elements
        if (isEmpty(preceding, flags)) continue

        return getTailQuantifiers(preceding, direction, flags)
    }

    if (parent.parent.type === "Pattern") {
        return undefined
    }
    return getPrecedingQuantifiers(parent.parent, direction, flags)
}
