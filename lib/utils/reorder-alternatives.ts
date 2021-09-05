import type { CharSet } from "refa"
import { CharBase } from "refa"
import type { MatchingDirection } from "regexp-ast-analysis"
import {
    isPotentiallyZeroLength,
    getFirstCharAfter,
    Chars,
    getLengthRange,
    getMatchingDirection,
    hasSomeDescendant,
    isEmptyBackreference,
} from "regexp-ast-analysis"
import type { Alternative, Element, Node, Pattern } from "regexpp/ast"
import type { RegExpContext } from "."
import { getLongestPrefix } from "./regexp-ast/alternative-prefix"

/**
 * This extends the {@link MatchingDirection} type to allow unknown matching
 * directions.
 *
 * This is useful when the matching direction of an element/alternative cannot
 * be known with 100% certainty.
 */
export type OptionalMatchingDirection = MatchingDirection | "unknown"

export interface CanReorderOptions {
    /**
     * The matching direction of the alternatives.
     *
     * The correctness of {@link canReorder} depends on this direction being
     * correct.
     *
     * If the matching direction cannot be known, supply `"unknown"`.
     * `"unknown"` is guaranteed to always create a correct result regardless
     * of matching direction.
     *
     * This value defaults to the result of {@link getMatchingDirection} for
     * any of the given alternatives.
     */
    matchingDirection?: OptionalMatchingDirection
    ignoreCapturingGroups?: boolean
}

/**
 * Returns whether the given alternatives can all be reordered.
 *
 * However, there are restriction how alternatives can be reordered. Let T be
 * the set of the given alternatives and let U be the set of alternatives that
 * are **not** given and have the same parent as the given alternatives.
 *
 * If T is empty or U is empty, then the given alternatives can be reordered
 * freely without any restrictions. Otherwise, the following restrictions apply:
 *
 * 1.  All alternatives in U must remain in the same position relative to each
 *     other.
 * 2.  Let L and R be the lest most and right most alternatives in T. All
 *     alternatives left of L must stay to the left of L and all alternatives
 *     right of R must stay to the right of R.
 *
 * Example: `/0|1|2|A|3|4|B|C|5|6/`
 *
 * If given the alternatives `A`, `B`, `C`, then `true` will be returned. The
 * following are valid reorderings:
 *
 * - `/0|1|2|A|3|4|B|C|5|6/` (unchanged)
 * - `/0|1|2|3|A|4|B|C|5|6/`
 * - `/0|1|2|3|4|A|B|C|5|6/`
 * - `/0|1|2|A|B|3|4|C|5|6/`
 * - `/0|1|2|A|B|C|3|4|5|6/`
 *
 * The following are invalid reorderings:
 *
 * - `/0|1|2|A|4|3|B|C|5|6/` (restriction 1)
 * - `/A|0|1|2|3|4|B|C|5|6/` (restriction 2)
 * - `/0|1|2|A|3|4|C|5|6|B/` (restriction 2)
 */
export function canReorder(
    alternatives: Iterable<Alternative>,
    context: RegExpContext,
    options: CanReorderOptions = {},
): boolean {
    const { ignoreCapturingGroups = false, matchingDirection } = options

    const target = asSet(alternatives)
    if (target.size < 2) {
        // we can trivially reorder 0 or 1 alternatives
        return true
    }

    const slice = getAlternativesSlice(target)

    const dir = matchingDirection ?? getMatchingDirection(slice[0])
    const eqClasses =
        dir === "unknown"
            ? getDirectionIndependedDeterminismEqClasses(slice, context)
            : getDeterminismEqClasses(slice, dir, context)

    if (
        !ignoreCapturingGroups &&
        !canReorderCapturingGroups(target, slice, eqClasses)
    ) {
        return false
    }
    // from this point onward, we don't have to worry about capturing groups
    // anymore

    // we only have to prove that we can reorder alternatives within each
    // equivalence class.

    return eqClasses.every((eq) => {
        if (eq.length < 2) {
            return true
        }

        if (eq.every((a) => !target.has(a))) {
            // This equivalence class contains only non-target alternatives.
            // As by the guarantees provided by this function, these
            // alternatives are not required to be reorderable.
            return true
        }

        return (
            canReorderBasedOnLength(eq) ||
            canReorderBasedOnConsumedChars(eq, context)
        )
    })
}

/**
 * Returns whether the capturing groups in the slice alternative can be
 * reordered.
 */
function canReorderCapturingGroups(
    target: ReadonlySet<Alternative>,
    slice: readonly Alternative[],
    eqClasses: readonly (readonly Alternative[])[],
): boolean {
    // Reordering and capturing groups:
    // Reordering doesn't play well with capturing groups because changing
    // the order of two capturing groups is a change that can be observed
    // by the user and might break the regex. So we have to avoid changing
    // the relative order of two alternatives with capturing groups.
    //
    // Since target alternatives can be reordered, there must be at most one
    // target alternative containing capturing groups. If one target
    // alternative contains capturing groups, no other alternative in the
    // slice is allowed to contain capturing groups.

    const containsCG = cachedFn(containsCapturingGroup)

    let targetCG = 0
    let nonTargetCG = 0
    for (const a of slice) {
        if (containsCG(a)) {
            if (target.has(a)) {
                targetCG++
            } else {
                nonTargetCG++
            }
        }
    }

    if (targetCG > 1 || (targetCG === 1 && nonTargetCG !== 0)) {
        return false
    }

    if (nonTargetCG !== 0) {
        // A equivalence class containing a capturing group must not contain a
        // target alternative.
        //
        // Here is an example where this doesn't work: `/^(?:a|(b)|b)$/` with
        // the targets `a` and `b`. Since `/^(?:a|(b)|b)$/` !=
        // `/^(?:a|b|(b))$/`, we cannot reorder the target alternatives.

        return eqClasses.every((eq) => {
            return (
                // no capturing groups
                !eq.some(containsCapturingGroup) ||
                // or no target alternatives
                eq.every((a) => !target.has(a))
            )
        })
    } else if (targetCG !== 0) {
        // The target alternative with the capturing group must be in its own
        // equivalence class.

        return eqClasses.every((eq) => {
            return eq.length < 2 || !eq.some(containsCapturingGroup)
        })
    }

    return true
}

/**
 * This splits the set of alternative into disjoint non-empty equivalence
 * classes based on the characters consumed. The equivalence classes can be
 * reordered freely but elements within an equivalence class have to be proven
 * to be reorderable.
 *
 * The idea of determinism is that we can reorder alternatives freely if the
 * regex engine doesn't have a choice as to which alternative to take.
 *
 * E.g. we can freely reorder the alternatives `food|butter|bread` because the
 * alternative are not a prefix of each other and do not overlap.
 *
 * @param alternatives This is assumed to be a set of alternatives where all
 * alternatives have the same parent. It must be possible to iterate of the
 * collection multiple times.
 *
 * Ideally, the backing data structure of this parameter is `Set` but other
 * collection types are also possible.
 */
export function getDeterminismEqClasses(
    alternatives: Iterable<Alternative>,
    dir: OptionalMatchingDirection,
    context: RegExpContext,
): readonly (readonly Alternative[])[] {
    if (dir === "unknown") {
        return getDirectionIndependedDeterminismEqClasses(alternatives, context)
    }

    return getDirectionalDeterminismEqClasses(alternatives, dir, context)
}

/**
 * This will return equivalence classes independent of the matching direction
 * of the given alternatives.
 */
function getDirectionIndependedDeterminismEqClasses(
    alternatives: Iterable<Alternative>,
    context: RegExpContext,
): readonly (readonly Alternative[])[] {
    const ltr = getDirectionalDeterminismEqClasses(alternatives, "ltr", context)
    const rtl = getDirectionalDeterminismEqClasses(alternatives, "rtl", context)

    const disjoint = mergeOverlappingSets(new Set([...ltr, ...rtl]), (s) => s)

    const result: (readonly Alternative[])[] = []
    for (const sets of disjoint) {
        const eq = new Set<Alternative>()
        for (const s of sets) {
            s.forEach((a) => eq.add(a))
        }
        result.push([...eq])
    }

    return result
}

/**
 * This splits the set of alternative into disjoint non-empty equivalence
 * classes based on the characters consumed. The equivalence classes can be
 * reordered freely but elements within an equivalence class have to be proven
 * to be reorderable.
 *
 * The idea of determinism is that we can reorder alternatives freely if the
 * regex engine doesn't have a choice as to which alternative to take.
 *
 * E.g. we can freely reorder the alternatives `food|butter|bread` because the
 * alternative are not a prefix of each other and do not overlap.
 */
function getDirectionalDeterminismEqClasses(
    alternatives: Iterable<Alternative>,
    dir: MatchingDirection,
    context: RegExpContext,
): readonly (readonly Alternative[])[] {
    // Step 1:
    // We map each alternative to an array of CharSets. Each array represents a
    // concatenation that we are sure of. E.g. the alternative `abc*de` will
    // get the array `a, b, [cd]`, and `abc` will get `a, b, c`.
    const getPrefixCharSets = cachedFn<Alternative, readonly CharSet[]>((a) => {
        let prefix = getLongestPrefix(a, dir, context.flags)

        // We optimize a little here.
        // All trailing all-characters sets can be removed without affecting
        // the result of the equivalence classes.
        let all = 0
        for (let i = prefix.length - 1; i >= 0; i--) {
            if (prefix[i].isAll) {
                all++
            } else {
                break
            }
        }

        if (all > 0) {
            prefix = prefix.slice(0, prefix.length - all)
        }

        return prefix
    })

    // Step 2:
    // Remap the prefix CharSets to use base sets instead. The following
    // operations will scale linearly with the number of characters. By using
    // base sets instead of the raw CharSets, we can drastically reduce the
    // number "logical" characters. It's the same trick refa uses for its DFA
    // operations (creation, minimization).
    const allCharSets = new Set<CharSet>()
    for (const a of alternatives) {
        getPrefixCharSets(a).forEach((cs) => allCharSets.add(cs))
    }
    const base = new CharBase(allCharSets)

    interface Prefix {
        readonly characters: readonly (readonly number[])[]
        readonly alternative: Alternative
    }
    const prefixes: Prefix[] = []
    for (const a of alternatives) {
        prefixes.push({
            characters: getPrefixCharSets(a).map((cs) => base.split(cs)),
            alternative: a,
        })
    }

    // Step 3:
    // Create equivalence classes from the prefixes. In the first iteration, we
    // will only look at the first character and create equivalence classes
    // based on that. Then we will try to further sub-divide the equivalence
    // classes based on the second character of the prefixes. This sub-division
    // process will continue until one prefix in the a equivalence class runs
    // out of characters.

    /** Subdivide */
    function subdivide(
        eqClass: ReadonlySet<Prefix>,
        index: number,
    ): (readonly Prefix[])[] {
        if (eqClass.size < 2) {
            return [[...eqClass]]
        }

        for (const prefix of eqClass) {
            if (index >= prefix.characters.length) {
                // ran out of characters
                return [[...eqClass]]
            }
        }

        const disjointSets = mergeOverlappingSets(
            eqClass,
            (p) => p.characters[index],
        )

        const result: (readonly Prefix[])[] = []
        for (const set of disjointSets) {
            result.push(...subdivide(set, index + 1))
        }

        return result
    }

    return subdivide(new Set(prefixes), 0).map((eq) =>
        eq.map((p) => p.alternative),
    )
}

class SetEquivalence {
    private readonly indexes: number[]

    public readonly count: number

    public constructor(count: number) {
        this.count = count
        this.indexes = []
        for (let i = 0; i < count; i++) {
            this.indexes.push(i)
        }
    }

    public makeEqual(a: number, b: number): void {
        // This works using the following idea:
        //  1. If the eq set of a and b is the same, then we can stop.
        //  2. If indexes[a] < indexes[b], then we want to make
        //     indexes[b] := indexes[a]. However, this means that we lose the
        //     information about the indexes[b]! So we will store
        //     oldB := indexes[b], then indexes[b] := indexes[a], and then
        //     make oldB == a.
        //  3. If indexes[a] > indexes[b], similar to 2.

        let aValue = this.indexes[a]
        let bValue = this.indexes[b]
        while (aValue !== bValue) {
            if (aValue < bValue) {
                this.indexes[b] = aValue
                // eslint-disable-next-line no-param-reassign -- x
                b = bValue
                bValue = this.indexes[b]
            } else {
                this.indexes[a] = bValue
                // eslint-disable-next-line no-param-reassign -- x
                a = aValue
                aValue = this.indexes[a]
            }
        }
    }

    /**
     * This returns:
     *
     * 1. `eqSet.count`: How many different equivalence classes there are.
     * 2. `eqSet.indexes`: A map (array) from each element (index) to the index
     *    of its equivalence class.
     *
     * All equivalence class indexes `eqSet.indexes[i]` are guaranteed to
     * be <= `eqSet.count`.
     */
    public getEquivalenceSets(): { count: number; indexes: number[] } {
        let counter = 0
        for (let i = 0; i < this.count; i++) {
            if (i === this.indexes[i]) {
                this.indexes[i] = counter++
            } else {
                this.indexes[i] = this.indexes[this.indexes[i]]
            }
        }
        return {
            count: counter,
            indexes: this.indexes,
        }
    }
}

/**
 * Given a set of sets (`S`), this will merge all overlapping sets until all
 * sets are disjoint.
 *
 * This assumes that all sets contain at least one element.
 *
 * This function will not merge the given sets itself. Instead, it will
 * return an iterable of sets (`Set<S>`) of sets (`S`) to merge. Each set (`S`)
 * is guaranteed to be returned exactly once.
 */
function mergeOverlappingSets<S, E>(
    sets: ReadonlySet<S>,
    getElements: (set: S) => Iterable<E>,
): ReadonlySet<S>[] {
    if (sets.size < 2) {
        return [sets]
    }

    const setArray: readonly S[] = [...sets]
    const eq = new SetEquivalence(setArray.length)
    const elementMap = new Map<E, number>()

    for (let i = 0; i < setArray.length; i++) {
        const s = setArray[i]
        for (const e of getElements(s)) {
            const elementSet = elementMap.get(e)
            if (elementSet === undefined) {
                // It's the first time we see this element.
                elementMap.set(e, i)
            } else {
                // We've seen this element before in another set.
                // Make the 2 sets equal.
                eq.makeEqual(i, elementSet)
            }
        }
    }

    const eqSets = eq.getEquivalenceSets()

    const result: Set<S>[] = []
    for (let i = 0; i < eqSets.count; i++) {
        result.push(new Set())
    }
    for (let i = 0; i < setArray.length; i++) {
        result[eqSets.indexes[i]].add(setArray[i])
    }
    return result
}

/**
 * Returns whether alternatives can be reordered because they all have the same
 * length.
 *
 * No matter which alternative the regex engine picks, we will always end up in
 * the same place after.
 */
function canReorderBasedOnLength(slice: readonly Alternative[]): boolean {
    const lengthRange = getLengthRange(slice)
    return Boolean(lengthRange && lengthRange.min === lengthRange.max)
}

/**
 * Returns whether alternatives can be reordered because the characters
 * consumed.
 *
 * If the given alternatives are preceded and followed by characters not
 * consumed by the alternatives, then the order order of the alternatives
 * doesn't matter.
 */
function canReorderBasedOnConsumedChars(
    slice: readonly Alternative[],
    context: RegExpContext,
): boolean {
    // we assume that at least one character is consumed in each alternative
    if (slice.some(isPotentiallyZeroLength)) {
        return false
    }

    const parent = slice[0].parent
    if (parent.type === "Pattern" || parent.type === "Assertion") {
        return false
    }

    const consumedChars = Chars.empty(context.flags).union(
        ...slice.map((a) => getConsumedChars(a, context)),
    )

    return (
        getFirstCharAfter(parent, "rtl", context.flags).char.isDisjointWith(
            consumedChars,
        ) &&
        getFirstCharAfter(parent, "ltr", context.flags).char.isDisjointWith(
            consumedChars,
        )
    )
}

/**
 * Returns the smallest slice of alternatives that contains all given
 * alternatives.
 */
function getAlternativesSlice(set: ReadonlySet<Alternative>): Alternative[] {
    if (set.size <= 1) {
        return [...set]
    }

    let first
    for (const item of set) {
        first = item
        break
    }

    if (!first) {
        throw new Error()
    }

    const parentAlternatives = first.parent.alternatives
    let min = set.size
    let max = 0

    for (let i = 0; i < parentAlternatives.length; i++) {
        const a = parentAlternatives[i]
        if (set.has(a)) {
            min = Math.min(min, i)
            max = Math.max(max, i)
        }
    }

    return parentAlternatives.slice(min, max + 1)
}

/**
 * Returns a readonly set containing all elements of the given iterable.
 */
function asSet<T>(iter: Iterable<T>): ReadonlySet<T> {
    if (iter instanceof Set) {
        return iter
    }
    return new Set(iter)
}

/**
 * Returns the union of all characters that can possibly be consumed by the
 * given element.
 */
function getConsumedChars(
    element: Element | Pattern | Alternative,
    context: RegExpContext,
): CharSet {
    const sets: CharSet[] = []

    // we misuse hasSomeDescendant to iterate all relevant elements
    hasSomeDescendant(
        element,
        (d) => {
            if (
                d.type === "Character" ||
                d.type === "CharacterClass" ||
                d.type === "CharacterSet"
            ) {
                sets.push(context.toCharSet(d))
            } else if (d.type === "Backreference" && !isEmptyBackreference(d)) {
                sets.push(getConsumedChars(d.resolved, context))
            }

            // always continue to the next element
            return false
        },
        // don't go into assertions
        (d) => d.type !== "Assertion" && d.type !== "CharacterClass",
    )

    return Chars.empty(context.flags).union(...sets)
}

/** Returns whether the given node contains a capturing group. */
function containsCapturingGroup(node: Node): boolean {
    return hasSomeDescendant(node, (d) => d.type === "CapturingGroup")
}

interface CachedFn<S, T> {
    (value: S): T
    readonly cache: Map<S, T>
}

/**
 * Create a new cached function.
 */
function cachedFn<S, T>(fn: (value: S) => T): CachedFn<S, T> {
    /** */
    function wrapper(value: S): T {
        let cached = wrapper.cache.get(value)
        if (cached === undefined) {
            cached = fn(value)
            wrapper.cache.set(value, cached)
        }
        return cached
    }

    wrapper.cache = new Map<S, T>()

    return wrapper
}
