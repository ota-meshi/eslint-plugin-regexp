import type { RegExpVisitor } from "regexpp/visitor"
import type { Alternative, Element, Pattern } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import {
    CP_MINUS,
    CP_SPACE,
    CP_APOSTROPHE,
    createRule,
    defineRegexpVisitor,
} from "../utils"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import {
    Chars,
    getFirstConsumedChar,
    hasSomeDescendant,
} from "regexp-ast-analysis"
import type { CharSet } from "refa"
import { JS } from "refa"
import type { SourceLocation, Position } from "estree"
import { canReorder } from "../utils/reorder-alternatives"
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
                    { min: CP_MINUS, max: CP_MINUS },
                    { min: CP_APOSTROPHE, max: CP_APOSTROPHE },
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
    const l = Math.min(a.length, b.length)
    for (let i = 0; i < l; i++) {
        const diff = a.charCodeAt(i) - b.charCodeAt(i)
        if (diff !== 0) {
            return diff
        }
    }

    return a.length - b.length
}

/**
 * Sorts the given alternatives.
 */
function sortAlternatives(
    alternatives: Alternative[],
    context: RegExpContext,
): void {
    const firstChars = new Map<Alternative, number>()
    for (const a of alternatives) {
        const chars = getFirstConsumedChar(a, "ltr", context.flags)
        const char =
            chars.empty || chars.char.isEmpty
                ? Infinity
                : chars.char.ranges[0].min
        firstChars.set(a, char)
    }

    alternatives.sort((a, b) => {
        const firstA = firstChars.get(a)!
        const firstB = firstChars.get(b)!
        if (firstA !== firstB) {
            return firstA - firstB
        }

        if (context.flags.ignoreCase) {
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
    return /^(?:0|[1-9]\d*)$/.test(str)
}

/**
 * This tries to sort the given alternatives by assuming that all alternatives
 * are a number.
 */
function trySortNumberAlternatives(alternatives: Alternative[]): void {
    const numberRanges: [number, number][] = []
    {
        let start = 0
        for (let i = 0; i < alternatives.length; i++) {
            if (!isIntegerString(alternatives[i].raw)) {
                if (start < i) {
                    numberRanges.push([start, i])
                }
                start = i + 1
            }
        }
        if (start < alternatives.length) {
            numberRanges.push([start, alternatives.length])
        }
    }

    for (const [start, end] of numberRanges) {
        const slice = alternatives.slice(start, end)

        slice.sort((a, b) => {
            return Number(a.raw) - Number(b.raw)
        })

        alternatives.splice(start, end - start, ...slice)
    }
}

/**
 * Returns the combined source location of the two given locations.
 */
function unionLocations(a: SourceLocation, b: SourceLocation): SourceLocation {
    /** x < y */
    function less(x: Position, y: Position): boolean {
        if (x.line < y.line) {
            return true
        } else if (x.line > y.line) {
            return false
        }
        return x.column < y.column
    }

    return {
        start: { ...(less(a.start, b.start) ? a.start : b.start) },
        end: { ...(less(a.end, b.end) ? b.end : a.end) },
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
    index: number
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
                runs.push({ index, elements })
                elements = []
            }
        }

        index++
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
            sort:
                "The alternatives of this group can be sorted without affecting the regex.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const {
                node,
                getRegexpLocation,
                fixReplaceNode,
                flags,
            } = regexpContext

            const allowedChars = getAllowedChars(flags)

            /**
             * Creates a report if the sorted alternatives are different from
             * the unsorted ones.
             */
            function enforceSorted(sorted: Alternative[]): void {
                const parent = sorted[0].parent
                const unsorted = parent.alternatives

                const bounds = getReorderingBounds(unsorted, sorted)
                if (!bounds) {
                    return
                }

                const loc = unionLocations(
                    getRegexpLocation(unsorted[bounds[0]]),
                    getRegexpLocation(unsorted[bounds[1]]),
                )

                context.report({
                    node,
                    loc,
                    messageId: "sort",
                    fix: fixReplaceNode(parent, () => {
                        const prefix = parent.raw.slice(
                            0,
                            parent.alternatives[0].start - parent.start,
                        )
                        const suffix = parent.raw.slice(
                            parent.alternatives[parent.alternatives.length - 1]
                                .end - parent.start,
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

                if (!containsOnlyLiterals(parent)) {
                    return
                }

                if (
                    hasSomeDescendant(
                        parent,
                        (d) => d !== parent && d.type === "CapturingGroup",
                    )
                ) {
                    // it's not safe to reorder alternatives with capturing groups
                    return
                }

                const consumedChars = getPossiblyConsumedChar(
                    parent,
                    regexpContext,
                ).char
                if (consumedChars.isEmpty) {
                    // all alternatives are either empty or only contain
                    // assertions
                    return
                }
                if (!consumedChars.isSubsetOf(allowedChars.allowed)) {
                    // contains some chars that are not allowed
                    return
                }
                if (consumedChars.isDisjointWith(allowedChars.required)) {
                    // doesn't contain required chars
                    return
                }

                const alternatives = [...parent.alternatives]

                if (canReorder(alternatives, regexpContext)) {
                    // alternatives can be reordered freely
                    sortAlternatives(alternatives, regexpContext)
                    trySortNumberAlternatives(alternatives)
                } else if (!consumedChars.isDisjointWith(Chars.digit(flags))) {
                    // let's try to at least sort numbers
                    const runs = getRuns(alternatives, (a) =>
                        isIntegerString(a.raw),
                    )
                    for (const { index, elements } of runs) {
                        if (
                            elements.length > 1 &&
                            canReorder(elements, regexpContext)
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

                enforceSorted(alternatives)
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
