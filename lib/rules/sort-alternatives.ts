import type { RegExpVisitor } from "regexpp/visitor"
import type { Alternative, Element, Pattern } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import {
    CP_MINUS,
    CP_PLUS,
    CP_STAR,
    CP_QUESTION,
    CP_SLASH,
    CP_SPACE,
    CP_APOSTROPHE,
    createRule,
    defineRegexpVisitor,
} from "../utils"
import type {
    GetLongestPrefixOptions,
    ReadonlyFlags,
} from "regexp-ast-analysis"
import {
    Chars,
    getFirstConsumedChar,
    hasSomeDescendant,
    canReorder,
    getLongestPrefix,
} from "regexp-ast-analysis"
import type { CharSet } from "refa"
import { JS } from "refa"
import { getPossiblyConsumedChar } from "../utils/regexp-ast"

interface AllowedChars {
    allowed: CharSet
    required: CharSet
}
const cache = new Map<string, Readonly<AllowedChars>>()

/** */
function getAllowedChars(flags: ReadonlyFlags) {
    const cacheKey = (flags.ignoreCase ? "i" : "") + (flags.unicode ? "u" : "")
    let result = cache.get(cacheKey)
    if (result === undefined) {
        result = {
            allowed: JS.createCharSet(
                [
                    { kind: "word", negate: false },
                    { min: CP_SPACE, max: CP_SPACE },

                    // common punctuation and operators
                    { min: CP_PLUS, max: CP_PLUS },
                    { min: CP_MINUS, max: CP_MINUS },
                    { min: CP_STAR, max: CP_STAR },
                    { min: CP_SLASH, max: CP_SLASH },

                    { min: CP_APOSTROPHE, max: CP_APOSTROPHE },
                    { min: CP_QUESTION, max: CP_QUESTION },
                ],
                flags,
            ),
            required: Chars.word(flags),
        }
        cache.set(cacheKey, result)
    }
    return result
}

/**
 * Returns whether the given element contains only literal characters and
 * groups/other elements containing literal characters.
 */
function containsOnlyLiterals(
    element: Element | Pattern | Alternative,
): boolean {
    return !hasSomeDescendant(
        element,
        (d) => {
            return (
                d.type === "Backreference" ||
                d.type === "CharacterSet" ||
                (d.type === "Quantifier" && d.max === Infinity) ||
                (d.type === "CharacterClass" && d.negate)
            )
        },
        (d) => d.type !== "Assertion",
    )
}

/**
 * Compare two string independent of the current locale by byte order.
 */
function compareByteOrder(a: string, b: string): number {
    if (a === b) {
        return 0
    }
    return a < b ? -1 : +1
}

/**
 * Compare two char sets by byte order.
 */
function compareCharSets(a: CharSet, b: CharSet): number {
    // empty char set > everything else
    if (a.isEmpty) {
        return 1
    } else if (b.isEmpty) {
        return -1
    }

    // the first character is different
    if (a.ranges[0].min !== b.ranges[0].min) {
        return a.ranges[0].min - b.ranges[0].min
    }

    // Now for the difficult part: We want to compare them by byte-order but
    // what does that mean for a set of characters?
    // We will define it as such: Let x be the smallest character in the
    // symmetric difference of a and b. If x is in a then a < b. Otherwise
    // b < a. If the symmetric difference is empty, then a == b.

    const symDiff = a.union(b).without(a.intersect(b))
    if (symDiff.isEmpty) {
        // a == b
        return 0
    }

    const min = symDiff.ranges[0].min

    if (a.has(min)) {
        // a < b
        return -1
    }

    // b < a
    return 1
}

/**
 * Compare two strings of char sets by byte order.
 */
function compareCharSetStrings(
    a: readonly CharSet[],
    b: readonly CharSet[],
): number {
    const l = Math.min(a.length, b.length)
    for (let i = 0; i < l; i++) {
        const diff = compareCharSets(a[i], b[i])
        if (diff !== 0) {
            return diff
        }
    }

    return a.length - b.length
}

const LONGEST_PREFIX_OPTIONS: GetLongestPrefixOptions = {
    includeAfter: true,
    onlyInside: true,
    looseGroups: true,
}

/**
 * Sorts the given alternatives.
 */
function sortAlternatives(
    alternatives: Alternative[],
    flags: ReadonlyFlags,
): void {
    const firstChars = new Map<Alternative, number>()
    for (const a of alternatives) {
        const chars = getFirstConsumedChar(a, "ltr", flags)
        const char =
            chars.empty || chars.char.isEmpty
                ? Infinity
                : chars.char.ranges[0].min
        firstChars.set(a, char)
    }

    alternatives.sort((a, b) => {
        const prefixDiff = compareCharSetStrings(
            getLongestPrefix(a, "ltr", flags, LONGEST_PREFIX_OPTIONS),
            getLongestPrefix(b, "ltr", flags, LONGEST_PREFIX_OPTIONS),
        )
        if (prefixDiff !== 0) {
            return prefixDiff
        }

        if (flags.ignoreCase) {
            return (
                compareByteOrder(a.raw.toUpperCase(), b.raw.toUpperCase()) ||
                compareByteOrder(a.raw, b.raw)
            )
        }

        return compareByteOrder(a.raw, b.raw)
    })
}

/**
 * Returns whether the given string is a valid integer.
 * @param str
 * @returns
 */
function isIntegerString(str: string): boolean {
    return /^(?:0|[1-9]\d*)$/u.test(str)
}

/**
 * This tries to sort the given alternatives by assuming that all alternatives
 * are a number.
 */
function trySortNumberAlternatives(alternatives: Alternative[]): void {
    const runs = getRuns(alternatives, (a) => isIntegerString(a.raw))
    for (const { startIndex, elements } of runs) {
        elements.sort((a, b) => {
            return Number(a.raw) - Number(b.raw)
        })
        alternatives.splice(startIndex, elements.length, ...elements)
    }
}

/**
 * Returns the indexes of the first and last of original array that is changed
 * when compared with the reordered one.
 */
function getReorderingBounds<T>(
    original: readonly T[],
    reorder: readonly T[],
): [number, number] | undefined {
    if (original.length !== reorder.length) {
        return undefined
    }

    const len = original.length

    let first = 0
    for (; first < len && original[first] === reorder[first]; first++);

    if (first === len) {
        return undefined
    }

    let last = len - 1
    for (; last >= 0 && original[last] === reorder[last]; last--);

    return [first, last]
}

interface Run<T> {
    startIndex: number
    elements: T[]
}

/**
 * Returns an array of runs of elements that fulfill the given condition.
 */
function getRuns<T>(iter: Iterable<T>, condFn: (item: T) => boolean): Run<T>[] {
    const runs: Run<T>[] = []

    let elements: T[] = []
    let index = 0

    for (const item of iter) {
        if (condFn(item)) {
            elements.push(item)
        } else {
            if (elements.length > 0) {
                runs.push({ startIndex: index - elements.length, elements })
                elements = []
            }
        }

        index++
    }

    if (elements.length > 0) {
        runs.push({ startIndex: index - elements.length, elements })
        elements = []
    }

    return runs
}

export default createRule("sort-alternatives", {
    meta: {
        docs: {
            description: "sort alternatives if order doesn't matter",
            category: "Best Practices",
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            sort: "The alternatives of this group can be sorted without affecting the regex.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const sliceMinLength = 3

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation, fixReplaceNode, flags } =
                regexpContext

            const allowedChars = getAllowedChars(flags)

            const possibleCharsCache = new Map<Alternative, CharSet>()

            /** A cached version of getPossiblyConsumedChar */
            function getPossibleChars(a: Alternative): CharSet {
                let chars = possibleCharsCache.get(a)
                if (chars === undefined) {
                    chars = getPossiblyConsumedChar(a, flags).char
                    possibleCharsCache.set(a, chars)
                }
                return chars
            }

            /** Tries to sort the given alternatives. */
            function trySortRun(run: Run<Alternative>): void {
                const alternatives = run.elements

                if (canReorder(alternatives, flags)) {
                    // alternatives can be reordered freely
                    sortAlternatives(alternatives, flags)
                    trySortNumberAlternatives(alternatives)
                } else {
                    const consumedChars = Chars.empty(flags).union(
                        ...alternatives.map(getPossibleChars),
                    )
                    if (!consumedChars.isDisjointWith(Chars.digit(flags))) {
                        // let's try to at least sort numbers
                        const runs = getRuns(alternatives, (a) =>
                            isIntegerString(a.raw),
                        )

                        for (const { startIndex: index, elements } of runs) {
                            if (
                                elements.length > 1 &&
                                canReorder(elements, flags)
                            ) {
                                trySortNumberAlternatives(elements)
                                alternatives.splice(
                                    index,
                                    elements.length,
                                    ...elements,
                                )
                            }
                        }
                    }
                }

                enforceSorted(run)
            }

            /**
             * Creates a report if the sorted alternatives are different from
             * the unsorted ones.
             */
            function enforceSorted(run: Run<Alternative>): void {
                const sorted = run.elements
                const parent = sorted[0].parent
                const unsorted = parent.alternatives.slice(
                    run.startIndex,
                    run.startIndex + sorted.length,
                )

                const bounds = getReorderingBounds(unsorted, sorted)
                if (!bounds) {
                    return
                }

                const loc = getRegexpLocation({
                    start: unsorted[bounds[0]].start,
                    end: unsorted[bounds[1]].end,
                })

                context.report({
                    node,
                    loc,
                    messageId: "sort",
                    fix: fixReplaceNode(parent, () => {
                        const prefix = parent.raw.slice(
                            0,
                            unsorted[0].start - parent.start,
                        )
                        const suffix = parent.raw.slice(
                            unsorted[unsorted.length - 1].end - parent.start,
                        )

                        return (
                            prefix + sorted.map((a) => a.raw).join("|") + suffix
                        )
                    }),
                })
            }

            /** The handler for parents */
            function onParent(parent: Alternative["parent"]): void {
                if (parent.alternatives.length < 2) {
                    return
                }

                const runs = getRuns(parent.alternatives, (a) => {
                    if (!containsOnlyLiterals(a)) {
                        return false
                    }

                    const consumedChars = getPossibleChars(a)
                    if (consumedChars.isEmpty) {
                        // the alternative is either empty or only contains
                        // assertions
                        return false
                    }
                    if (!consumedChars.isSubsetOf(allowedChars.allowed)) {
                        // contains some chars that are not allowed
                        return false
                    }
                    if (consumedChars.isDisjointWith(allowedChars.required)) {
                        // doesn't contain required chars
                        return false
                    }

                    return true
                })

                if (
                    runs.length === 1 &&
                    runs[0].elements.length === parent.alternatives.length
                ) {
                    // All alternatives are to be sorted
                    trySortRun(runs[0])
                } else {
                    // Some slices are to be sorted
                    for (const run of runs) {
                        if (
                            run.elements.length >= sliceMinLength &&
                            run.elements.length >= 2
                        ) {
                            trySortRun(run)
                        }
                    }
                }
            }

            return {
                onGroupEnter: onParent,
                onPatternEnter: onParent,
                onCapturingGroupEnter: onParent,
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
